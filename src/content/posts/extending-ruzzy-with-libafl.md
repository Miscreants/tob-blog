---
title: Extending Ruzzy with LibAFL
description: "We added LibAFL support to Ruzzy, our coverage-guided fuzzer for pure Ruby code and Ruby C extensions."
type: release
location: fuzzing-testing/fuzzing
alsoIn: [tools]
authors: [Matt Schwager]
date: 2026-04-29
featured: false
---

LibAFL is all the rage in the fuzzing community these days, especially with LLVM’s libFuzzer being placed in [maintenance mode](https://llvm.org/docs/LibFuzzer.html#status). Written in Rust, [LibAFL claims](https://www.s3.eurecom.fr/docs/ccs22_fioraldi.pdf) improved performance, modularity, state-of-the-art fuzzing techniques, and [libFuzzer compatibility](https://github.com/AFLplusplus/LibAFL/tree/0.15.4/crates/libafl_libfuzzer). For these reasons, I set out to add LibAFL support to [Ruzzy](https://github.com/trailofbits/ruzzy), our coverage-guided fuzzer for pure Ruby code and Ruby C extensions. This gives Ruby developers and security researchers access to a more advanced and actively maintained fuzzing engine without changing how they write their fuzzing harnesses.

Ruzzy was [originally built](https://blog.trailofbits.com/2024/03/29/introducing-ruzzy-a-coverage-guided-ruby-fuzzer/) on top of LLVM’s libFuzzer, so using LibAFL’s compatibility layer should be easy enough. However, digging around in the internals of complex systems is never quite as simple as it seems. In this post, I will investigate some of the deep plumbing inside these fuzzing engines, take a detour into executable and linkable format (ELF) files, and ultimately add LibAFL support to Ruzzy.

## Building with libafl\_libfuzzer

Ruzzy currently supports Linux, so I use a [Dockerfile](https://github.com/trailofbits/ruzzy/blob/v0.7.0/Dockerfile) for development and for production fuzzing campaigns. To that end, using a similar Dockerfile for LibAFL support is the simplest integration point. LibAFL provides excellent [documentation](https://github.com/AFLplusplus/LibAFL/tree/0.15.4/crates/libafl_libfuzzer#usage-as-a-standalone-library-for-ccetc) and build scripts to use it as a standalone library. We need to build LibAFL as a standalone library because Ruzzy uses [libFuzzer as a library](https://llvm.org/docs/LibFuzzer.html#using-libfuzzer-as-a-library).

Following along with the standalone `libafl_libfuzzer` documentation, and with the [`build.sh`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_libfuzzer_runtime/build.sh) script in hand, we can build `libFuzzer.a`. This is the archive that will ultimately be linked into Ruzzy’s C extension and used to fuzz our target. Here are the relevant lines from our new Dockerfile:

```dockerfile
# Install Rust nightly via rustup
RUN wget -qO- https://sh.rustup.rs | sh -s -- \
    -y \
    --default-toolchain nightly \
    --component llvm-tools

ENV PATH="/root/.cargo/bin:${PATH}"

# Clone LibAFL
RUN git clone --depth 1 https://github.com/AFLplusplus/LibAFL /libafl

# Build libFuzzer.a from LibAFL's libfuzzer runtime
WORKDIR /libafl/crates/libafl_libfuzzer_runtime

RUN bash build.sh
```

_Figure 1: Building LibAFL’s libFuzzer.a (Dockerfile.LibAFL)_

This all goes smoothly and gives us our desired output: `libFuzzer.a`. Next, we need to make a slight tweak to Ruzzy’s mechanism for determining a `fuzzer_no_main` library. Using `fuzzer_no_main` and `-fsanitize=fuzzer-no-link` is libFuzzer’s [standard mechanism](https://llvm.org/docs/LibFuzzer.html#using-libfuzzer-as-a-library) for fuzzing code that provides its own `main` function. This makes sense for interpreted languages because the interpreter, well, brings its own `main`.

To accomplish the desired flexibility in Ruzzy, we simply need to prioritize an ENV variable, if present, that specifies the `fuzzer_no_main` library path, then fall back to Clang’s defaults if not:

```ruby
FUZZER_NO_MAIN_LIB_ENV = 'FUZZER_NO_MAIN_LIB'
...
fuzzer_no_main_lib = ENV.fetch(FUZZER_NO_MAIN_LIB_ENV, nil)

if fuzzer_no_main_lib
  LOGGER.info("Using #{FUZZER_NO_MAIN_LIB_ENV}=#{fuzzer_no_main_lib}")
  unless File.exist?(fuzzer_no_main_lib)
    LOGGER.error("#{FUZZER_NO_MAIN_LIB_ENV} file does not exist: #{fuzzer_no_main_lib}")
    exit(1)
  end
else
  fuzzer_no_main_libs = [
    'libclang_rt.fuzzer_no_main.a',
    'libclang_rt.fuzzer_no_main-aarch64.a',
    'libclang_rt.fuzzer_no_main-x86_64.a'
  ]
  fuzzer_no_main_lib = fuzzer_no_main_libs.map { |lib| get_clang_file_name(lib) }.find(&:itself)

  unless fuzzer_no_main_lib
    LOGGER.error("Could not find fuzzer_no_main using #{CC}.")
    LOGGER.error("Please include #{CC} in your path or specify #{FUZZER_NO_MAIN_LIB_ENV} ENV variable.")
    exit(1)
  end
end
```

_Figure 2: Allowing an ENV override for the fuzzing library (ext/cruzzy/extconf.rb)_

Now, let’s build Ruzzy with LibAFL’s `libFuzzer.a`:

```dockerfile
# Copy LibAFL's libFuzzer.a from builder stage
COPY --from=libafl-builder /libafl/crates/libafl_libfuzzer_runtime/ libFuzzer.a /usr/lib/libFuzzer.a

# Point Ruzzy at LibAFL's libFuzzer instead of clang's built-in
ENV FUZZER_NO_MAIN_LIB="/usr/lib/libFuzzer.a"

WORKDIR ruzzy/
COPY . .
RUN gem build
RUN RUZZY_DEBUG=1 gem install --development --verbose ruzzy-*.gem
```

_Figure 3: Building Ruzzy with LibAFL using a custom FUZZER\_NO\_MAIN\_LIB (Dockerfile.LibAFL)_

However, this produces the following error:

```text
INFO -- : Using FUZZER_NO_MAIN_LIB=/usr/lib/libFuzzer.a
DEBUG -- : Search for libclang_rt.asan.a using clang-21: success=true exists=false
DEBUG -- : Search for libclang_rt.asan-aarch64.a using clang-21: success=true exists=true
DEBUG -- : Search for libclang_rt.asan-x86_64.a using clang-21: success=true exists=false
DEBUG -- : Creating /usr/lib/llvm-21/lib/clang/21/lib/linux/libclang_rt.asan-aarch64.a sanitizer archive at /tmp/20260320-20-683d0b
DEBUG -- : Merging sanitizer at /tmp/20260320-20-683d0b with libFuzzer at /usr/lib/libFuzzer.a to asan_with_fuzzer.so
/usr/bin/ld: /usr/lib/libFuzzer.a(libFuzzer.o): .preinit_array section is not allowed in DSO
/usr/bin/ld: failed to set dynamic section sizes: nonrepresentable section on output
clang++-21: error: linker command failed with exit code 1 (use -v to see invocation)
ERROR -- : The clang++-21 shared object merging command failed.
*** extconf.rb failed ***
```

_Figure 4: Failure linking libFuzzer.a_

The key error here is “`.preinit_array` section is not allowed in DSO.” This was a new one for me. What is a `.preinit_array` section, and what is this error trying to tell me? The relevant [ELF documentation](https://refspecs.linuxbase.org/elf/gabi4+/ch5.dynamic.html#init_fini) states the following:

> Finally, an executable file may have pre-initialization functions. These functions are executed after the dynamic linker has built the process image and performed relocations but before any shared object initialization functions. Pre-initialization functions are not permitted in shared objects.
>
> …
>
> The DT\_PREINIT\_ARRAY table is processed only in an executable file; it is ignored if contained in a shared object.

So dynamic shared objects (DSOs) cannot contain a `.preinit_array` section. This is exactly what the error told us. `.init`, `.ctors`, `.init_array`, and `.preinit_array` are all mechanisms for running code before `main` starts in an ELF binary. Exploring each of these and the order in which they’re run is beyond the scope of this post (see [this explanation](https://maskray.me/blog/2021-11-07-init-ctors-init-array)), but suffice it to say we need to sidestep this `libafl_libfuzzer` implementation detail. Here’s how LibAFL and libFuzzer differ in this regard:

```shell
$ objdump -h /usr/lib/libFuzzer.a | grep 'init_array'
3100 .init_array   00000228  ...
5047 .preinit_array 00000008  ...
32136 .init_array.00099 00000008  ...
37083 .init_array.90 00000010  ...

$ objdump -h libclang_rt.fuzzer-aarch64.a | grep 'init_array'
 40 .init_array   00000008  ...
 57 .init_array   00000008  ...

$ objdump -h libclang_rt.fuzzer_no_main-aarch64.a | grep 'init_array'
 40 .init_array   00000008  ...
 57 .init_array   00000008  ...

$ objdump -h libclang_rt.fuzzer_interceptors-aarch64.a | grep 'init_array'
 21 .preinit_array 00000008  ...
```

_Figure 5: .init\_array vs. .preinit\_array in LibAFL vs. libFuzzer_

The figure above shows that LibAFL’s archive contains both `.init_array` and `.preinit_array` sections whereas Clang’s libFuzzer splits them across different files. Since LibAFL uses the [same interceptor code](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_targets/src/libfuzzer/FuzzerInterceptors.cpp#L1-L13) as Clang, it also defines the same [`.preinit_array`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_targets/src/libfuzzer/FuzzerInterceptors.cpp#L199-L200). The problem is that LibAFL provides [`libfuzzer_no_link_main`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_targets/Cargo.toml#L37) and [`libfuzzer_interceptors`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_targets/Cargo.toml#L39) features, but we cannot easily toggle them at build time.

This leaves us with two options: the proper solution, which is to propose a change upstream that allows these features to be toggled at build time, and the hacky, make-it-work solution. I wanted to keep moving forward and see this work end-to-end, so I started with the hacky solution. This required having a trick up our sleeve: GNU `ld` enforces the `.preinit_array`-in-a-DSO constraint, but LLVM `ld` does not. So we can modify Ruzzy’s build procedure to allow passing a user defined `ld` path at build time:

```diff
diff --git a/Dockerfile.LibAFL b/Dockerfile.LibAFL
index 5d0f9516..df6be2e2 100644
--- a/Dockerfile.LibAFL
+++ b/Dockerfile.LibAFL
@@ -54,9 +54,12 @@ RUN echo "deb http://apt.llvm.org/bookworm/ llvm-toolchain-bookworm-$LLVM_VERSION
    && echo "deb-src http://apt.llvm.org/bookworm/ llvm-toolchain-bookworm-$LLVM_VERSION main" >> /etc/apt/sources.list.d/ llvm.list \
    && wget -qO- https://apt.llvm.org/llvm-snapshot.gpg.key > /etc/apt/trusted.gpg.d/apt.llvm.org.asc

+# Install lld alongside clang. LibAFL's libFuzzer.a contains a .preinit_array
+# .preinit_array section that the GNU linker rejects in shared objects.
+# lld handles this correctly.
 RUN apt update && apt install -y \
    build-essential \
    clang-$LLVM_VERSION \
+   lld-$LLVM_VERSION \
    && rm -rf /var/lib/apt/lists/*

 ENV APP_DIR="/app"
@@ -69,6 +72,10 @@ ENV LDSHARED="clang-$LLVM_VERSION -shared"
 ENV LDSHAREDXX="clang++-$LLVM_VERSION -shared"
 ENV ASAN_SYMBOLIZER_PATH="/usr/bin/llvm-symbolizer-$LLVM_VERSION"

+# Use lld for linking. LibAFL's libFuzzer.a contains a .preinit_array section
+# that the GNU linker rejects in shared objects. lld handles this correctly.
+ENV LD="lld-$LLVM_VERSION"
+
 ENV MAKE="make --environment-overrides V=1"

 ENV ASAN_OPTIONS="symbolize=1:allocator_may_return_null=1:
detect_leaks=0:use_sigaltstack=0"
diff --git a/ext/cruzzy/extconf.rb b/ext/cruzzy/extconf.rb
index 6f474e62..260fcae6 100644
--- a/ext/cruzzy/extconf.rb
+++ b/ext/cruzzy/extconf.rb
@@ -19,6 +19,7 @@ LOGGER.level = ENV.key?('RUZZY_DEBUG') ?
Logger::DEBUG : Logger::INFO
 CC = ENV.fetch('CC', 'clang')
 CXX = ENV.fetch('CXX', 'clang++')
 AR = ENV.fetch('AR', 'ar')
+LD = ENV.fetch('LD', 'ld')
 FUZZER_NO_MAIN_LIB_ENV = 'FUZZER_NO_MAIN_LIB'

 LOGGER.debug("Ruby CC: #{RbConfig::CONFIG['CC']}")
@@ -66,6 +67,7 @@ def merge_sanitizer_libfuzzer_lib(sanitizer_lib,
fuzzer_no_main_lib, merged_outp
      '-ldl',
      '-lstdc++',
      '-shared',
+      "-fuse-ld=#{LD}",
      '-o',
      merged_output
    )
@@ -145,5 +147,6 @@ merge_sanitizer_libfuzzer_lib(
 $LOCAL_LIBS = fuzzer_no_main_lib

 $LIBS << ' -lstdc++'
+$DLDFLAGS << " -fuse-ld=#{LD}"

 create_makefile('cruzzy/cruzzy')
```

_Figure 6: Allow a user-specified ld binary_

And now the Docker build works! But building the fuzzing libraries, Ruby C extension, and Docker image is only the first step. We still have to run the fuzzer, which comes with its own set of challenges.

As for the proper fix I mentioned earlier, we did propose it upstream in [this pull request](https://github.com/AFLplusplus/LibAFL/pull/3734). Once that’s merged, we can run the build script with `--cargo-args "--no-default-features --features no_link_main"` and avoid the `ld` hack. Now, on to running the fuzzer.

## Fuzzing with LibAFL

Ruzzy includes its own [“dummy” C extension](https://github.com/trailofbits/ruzzy/blob/v0.7.0/ext/dummy/dummy.c) for testing the fuzzer and making sure everything is working as expected. We can use this to test out our LibAFL changes and make sure they’re working properly. After building the fuzzer and finally being able to start it, I got the following error:

```text
$ docker run --rm ruzzy-libafl -runs=100000
thread '<unnamed>' (9) panicked at src/fuzz.rs:275:5:
No maps available; cannot fuzz!
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
fatal runtime error: failed to initiate panic, error 2786066624, aborting
/usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:15: [BUG] Aborted at 0x0000000000000009
ruby 4.0.1 (2026-01-13 revision e04267a14b) +PRISM [aarch64-linux]

-- Control frame information -----------------------------------------------
c:0005 p:---- s:0022 e:000021 l:y b:---- CFUNC  :c_fuzz
c:0004 p:0011 s:0016 e:000015 l:y b:0001 METHOD /usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:15
c:0003 p:0008 s:0010 E:001390 l:y b:0001 METHOD /usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:28
c:0002 p:0010 s:0006 e:000005 l:n b:---- EVAL   -e:1 [FINISH]
c:0001 p:0000 s:0003 E:000940 l:y b:---- DUMMY  [FINISH]

-- Ruby level backtrace information ----------------------------------------
-e:1:in '<main>'
/usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:28:in 'dummy'
/usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:15:in 'fuzz'
/usr/local/bundle/gems/ruzzy-0.7.0/lib/ruzzy.rb:15:in 'c_fuzz'
...
```

_Figure 7: Runtime error when starting the fuzzer_

The key error here is “No maps available; cannot fuzz!” This [LibAFL error](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_libfuzzer/runtime/src/lib.rs#L552-L569) occurs when the [SanitizerCoverage](https://clang.llvm.org/docs/SanitizerCoverage.html) state is not initialized properly. To understand this discrepancy between LibAFL and libFuzzer, we must first understand what SanitizerCoverage is and how it works.

SanitizerCoverage tracks code coverage information during a fuzzing campaign to improve performance. Simple heuristics like “if we’ve discovered new code coverage, then continue to mutate relevant inputs to better explore these code paths” are powerful fuzzing primitives. The underlying theory is that higher code coverage results in more crashes and bugs (I’m oversimplifying, but you get the point). To that end, a fuzzing engine needs a mechanism for initializing and tracking coverage information.

SanitizerCoverage offers a variety of ways to track coverage information, all of which require a mechanism to initialize state at the beginning of a fuzzing campaign. For example, [the documentation](https://clang.llvm.org/docs/SanitizerCoverage.html#introduction) offers `pc-guard`, `8bit-counters`, `bool-flag`, and `pc-table` tracing mechanisms, each with a corresponding `init` function. These [`init` functions](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.1/llvm/lib/Transforms/Instrumentation/SanitizerCoverage.cpp#L76-L80) are eventually lowered and represented as [`.init_array` entries](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.1/llvm/lib/CodeGen/TargetLoweringObjectFileImpl.cpp#L1155-L1157) in ELF files (`.init_array` strikes again). This means that, ultimately, coverage initialization functionality is called when the DSO is loaded at runtime.

Back to the error at hand: why is LibAFL saying “No maps available; cannot fuzz!” while LLVM’s libFuzzer starts up just fine? The key distinction is that libFuzzer lazily allows new coverage counter arrays to be included at runtime and does not complain if none exist at startup. LibAFL, however, requires them to be defined when the fuzzer starts. Compare the following sequence of events:

- LibAFL [`LLVMFuzzerRunDriver`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_libfuzzer/runtime/src/lib.rs#L605)
  - Calls [`fuzz::fuzz`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_libfuzzer/runtime/src/lib.rs#L694)
  - Calls [`fuzz_with!`](https://github.com/AFLplusplus/LibAFL/blob/0.15.4/crates/libafl_libfuzzer/runtime/src/fuzz.rs#L271-L274)
  - Checks if coverage counters exist
- libFuzzer [`LLVMFuzzerRunDriver`](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.1/compiler-rt/lib/fuzzer/FuzzerDriver.cpp#L934)
  - Calls [`FuzzerDriver`](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.1/compiler-rt/lib/fuzzer/FuzzerDriver.cpp#L652)
  - Eventually calls [`Fuzzer::Loop`](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.1/compiler-rt/lib/fuzzer/FuzzerDriver.cpp#L923)
  - Does not check if coverage counters exist

So coverage `init` functions are called at DSO load time, after which the fuzzing engine may or may not check for their existence depending on implementation. To fully understand the cause of this error, we have to go back and better understand how Ruzzy runs its “dummy” C extension. The Ruzzy Docker image runs the “dummy” code by default via its entrypoint:

```shell
#!/bin/bash

LD_PRELOAD=$(ruby -e 'require "ruzzy"; print Ruzzy::ASAN_PATH') \
    ruby -e 'require "ruzzy"; Ruzzy.dummy' -- "$@"
```

_Figure 8: Docker image entrypoint (entrypoint.sh)_

`Ruzzy.dummy` corresponds to the following code:

```ruby
def fuzz(test_one_input, args = DEFAULT_ARGS)
  c_fuzz(test_one_input, args)  # STEP 3: Call Ruzzy.c_fuzz (in C extension)
end

def dummy_test_one_input(data)  # STEP 4: Eventually call Ruzzy.dummy_test_one_input
  # This 'require' depends on LD_PRELOAD, so it's placed inside the function
  # scope. This allows us to access EXT_PATH for LD_PRELOAD and not have a
  # circular dependency.
  require 'dummy/dummy'

  c_dummy_test_one_input(data)
end

def dummy  # STEP 1: Call Ruzzy.dummy
  fuzz(->(data) { dummy_test_one_input(data) })  # STEP 2: Call Ruzzy.fuzz
end
```

_Figure 9: Ruzzy.dummy call chain (lib/ruzzy.rb)_

If you’re searching for the bug, then the body of `dummy_test_one_input` may provide a hint. The issue here is that `require 'dummy/dummy'` is called too late. This `require` statement is actually loading the compiled Ruby C extension shared object. Remember what we learned above about loading shared objects? This shared object contains an `.init_array` function that initializes the coverage counter state. libFuzzer lazily uses coverage counter state, so it is not so sensitive about the ordering of events. LibAFL, however, requires that this state already be initialized before it begins fuzzing.

`Ruzzy.dummy` calls `fuzz` with a lambda that calls `dummy_test_one_input`. But because `dummy_test_one_input` is passed in a lambda and not invoked until the fuzzer starts, LibAFL errors out in the call to `c_fuzz` (`c_fuzz` calls `LLVMFuzzerRunDriver`). This makes sense given that the initial Ruby error traceback pointed at `c_fuzz`. So we end up with a quite minimal patch:

```diff
diff --git a/lib/ruzzy.rb b/lib/ruzzy.rb
index d5e9ae61..be5f8339 100644
--- a/lib/ruzzy.rb
+++ b/lib/ruzzy.rb
@@ -25,6 +25,11 @@ module Ruzzy
  end

  def dummy
+    # Load the instrumented shared object before calling fuzz so its coverage
+    # maps are registered before LLVMFuzzerRunDriver starts. Some fuzzer
+    # runtimes (e.g. LibAFL) require coverage maps to exist upfront.
+    require 'dummy/dummy'
+
    fuzz(->(data) { dummy_test_one_input(data) })
  end
```

_Figure 10: Ruzzy.dummy initialization patch_

With the `ld` and initialization patches, LibAFL finally works (!):

```text
$ docker run --rm ruzzy-libafl -runs=100000
...
       (CLIENT) corpus: 3, objectives: 0, executions: 7593, exec/sec: 0.000,
size_edges: 12/21 (57%), edges_stability: 11/11 (100%), edges: 12/21 (57%)
=================================================================
==9==ERROR: AddressSanitizer: heap-use-after-free on address 0xfcbfab6655c0 at pc 0xffffab9c1888 bp 0xffffee4ce430 sp 0xffffee4ce428
READ of size 1 at 0xfcbfab6655c0 thread T0
    #0 0xffffab9c1884 in _c_dummy_test_one_input /usr/local/bundle/gems/ ruzzy-0.7.0/ext/dummy/dummy.c:18:24
...
```

_Figure 11: Ruzzy fuzzing with LibAFL_

This AddressSanitizer output shows that LibAFL starts cleanly and quickly finds the intentional bug in `dummy.c`. The heap-use-after-free in the dummy C extension confirms the full pipeline is working: instrumentation, coverage tracking, tracing, and crash detection are all functioning as expected.

## Try out Ruzzy with LibAFL

We recently released [version 0.8.0](https://github.com/trailofbits/ruzzy/blob/main/CHANGELOG.md#080---2026-04-27) of Ruzzy, which includes LibAFL support. Give it a spin on your next Ruby project or audit. I worked with Claude on implementing this improvement, and sometimes it would race so far ahead to the finish line that it would take me two days to catch up. Getting a working implementation is still the end goal, and reverse engineering a patch is a lot easier after it _is_ working, but deeply understanding the patch is valuable too. I learned a lot about ELF binaries, fuzzing engine internals, linkers, and compilers throughout this process. LLMs are a useful tool not only for getting stuff done, but also for understanding the world around us.

If you’d like to read more about fuzzing, check out the following resources:

- Our [fuzzing chapter](https://appsec.guide/docs/fuzzing/) in the Testing Handbook
- [Continuously fuzzing Python C extensions](https://blog.trailofbits.com/2024/02/23/continuously-fuzzing-python-c-extensions/)
- [Breaking the Solidity Compiler with a Fuzzer](https://blog.trailofbits.com/2020/06/05/breaking-the-solidity-compiler-with-a-fuzzer/)

As always, [contact us](https://trailofbits.com/contact/) if you need help with your next Ruby project or fuzzing campaign.
