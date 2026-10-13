---
title: gosentry brings LibAFL-grade fuzzing to Go's native interface
description: "We built gosentry, a fuzzing-oriented fork of the Go toolchain that keeps the standard fuzzing workflow while using a stronger stack underneath."
type: release
location: fuzzing-testing/fuzzing
alsoIn: [tools, languages/go]
authors: [Kevin Valerio]
date: 2026-05-12
featured: true
---

## Why we built gosentry

Go's native fuzzing lags considerably behind what the Rust, C, and C++ ecosystems get from LibAFL and AFL++. Path constraints are hard to solve, and structured inputs usually need handmade parsing. The fuzzer also misses several bug categories, including integer overflows, goroutine leaks, data races, and execution timeouts.

So we built gosentry: a fuzzing-oriented fork of the Go toolchain that keeps the standard `testing.F` workflow while using a stronger fuzzing stack underneath. Existing harnesses keep working, and you run it through the interface you already know.

```shell
./bin/go test -fuzz=FuzzHarness --focus-on-new-code=false \
  --catch-races=true --catch-leaks=true
```

Coverage reports can be generated from existing campaigns with `--generate-coverage`, and gosentry manages campaign state automatically.

## Same harness, stronger engine

You keep writing targets with `testing.F`, seed the corpus with `f.Add`, and pass input through `f.Fuzz`. Underneath, gosentry captures the fuzz callback, builds a Go archive with libFuzzer-style entry points, and runs it in-process through a Rust-based LibAFL runner.

## More bugs become visible

gosentry turns more problematic behaviour into detectable failures: compiler-inserted integer overflow checks, optional truncation detection through go-panikint, data race detection with `--catch-races`, goroutine leak detection with `--catch-leaks`, and timeouts that surface infinite loops.

## Better inputs

### Struct-aware fuzzing

Standard Go fuzzing accepts only a limited set of parameter types. gosentry lets you fuzz structs, slices, arrays and pointers, encoding and decoding composite values for you.

```go
type Input struct {
	Data []byte
	S    string
	N    int
}

func FuzzStructInput(f *testing.F) {
	f.Add(Input{Data: []byte("hello"), S: "world", N: 42})
	f.Fuzz(func(t *testing.T, in Input) {
		Process(in)
	})
}
```

### Grammar-based fuzzing

Placeholder section — body copy to follow from the published post.

## What it has found already

Placeholder section — body copy to follow from the published post.
