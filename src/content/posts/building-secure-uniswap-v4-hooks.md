---
title: Building secure Uniswap v4 hooks
description: "This blog post identifies seven recurring failure patterns in application and hook code, including missing caller checks and accounting bugs that still satisfy the PoolManager's settlement invariant."
type: post
location: blockchain
alsoIn: [secure-engineering/assurance, vulnerabilities/disclosures]
authors: [Nicolas Donboly]
date: 2026-07-30
featured: false
---

Uniswap v4 hooks let developers add custom behavior to pools, including dynamic fees, custom accounting, and external integrations. This flexibility moves some security responsibilities into application and hook code.

The Cork and Bunni exploits are two app-level incidents that show what can go wrong in that code. Together, they account for more than $20M in losses. Neither incident stemmed from a flaw in the Uniswap v4 core protocol or the PoolManager; both arose from application-specific authorization and accounting logic built around hooks.

After analyzing dozens of findings from Trail of Bits audits (including our [Uniswap v4-core security review](https://github.com/trailofbits/publications/blob/master/reviews/2024-07-uniswap-v4-core-securityreview.pdf)), public reports from other firms, and the Solodit database, I’ve identified seven recurring failure patterns in application and hook code, including missing caller checks and accounting bugs that still satisfy the PoolManager’s settlement invariant. Builders can use these patterns as a secure-development checklist; auditors can use them to focus their review.

## What the PoolManager guarantees

If you’re familiar with Uniswap v3, where each pool was a separate contract, v4 inverts the model. All pool state now lives in a singleton PoolManager contract, with each pool represented in its storage. Uniswap v4 adds hooks: independent contracts that execute custom logic at specific points in the swap and liquidity lifecycle.

![Figure 1: Pools live inside the singleton PoolManager, and multiple pools can use the same hook contract.](../../assets/posts/building-secure-uniswap-v4-hooks/uniswapv4-figure-1.webp)

_Figure 1: Pools live inside the singleton PoolManager, and multiple pools can use the same hook contract._

Here’s what a pool looks like in v4:

```solidity
struct PoolKey {
    Currency currency0;
    Currency currency1;
    uint24 fee;
    int24 tickSpacing;
    IHooks hooks;
}
```

_Figure 2: A pool's PoolKey includes both currencies, the fee, tick spacing, and the hook address ([v4-core/src/types/PoolKey.sol](https://github.com/Uniswap/v4-core/blob/main/src/types/PoolKey.sol))._

Notice that the hook address (`IHooks hooks;`) is part of the pool’s identity. If you change any of these fields, you’re talking to a different pool. This matters because trusting the wrong `PoolKey` means trusting the wrong pool.

v4 also introduces a session-based model that works like a flash loan. Your contract calls `unlock()` on the PoolManager, which triggers a callback into your code. At the end, the PoolManager checks that no unsettled currency deltas remain:

```solidity
function unlock(bytes calldata data) external returns (bytes memory result) {
    Lock.unlock();
    // ... callback execution happens here ...
    if (NonzeroDeltaCount.read() != 0) revert CurrencyNotSettled();
    Lock.lock();
}
```

_Figure 3: Simplified PoolManager.unlock() flow: unlock the session, execute the callback, and revert unless all currency deltas settle to zero ([v4-core/src/PoolManager.sol](https://github.com/Uniswap/v4-core/blob/main/src/PoolManager.sol))._

![Figure 4: A periphery or hook calls PoolManager.unlock(), handles unlockCallback(), and calls swap() inside the unlocked session.](../../assets/posts/building-secure-uniswap-v4-hooks/uniswapv4-figure-4.webp)

_Figure 4: A periphery or hook calls PoolManager.unlock(), handles unlockCallback(), and calls swap() inside the unlocked session._

The PoolManager enforces v4’s protocol mechanics, including pool initialization rules, swap and liquidity math, hook-callback sequencing, and end-of-session settlement. Hook developers are responsible for validating the application-specific assumptions their hooks add.

Each hook must decide:

- Who can call its privileged paths
- Which pools are legitimate
- How custom balances and deltas should be accounted for
- Whether external integrations can fail or reenter safely

## 1. Anyone can call your hook

Hook callbacks are external functions on your contract. If you don’t check the caller, an attacker can call those callbacks directly with malicious parameters. A loose `unlockCallback` path can also reach internal actions that should never be callable.

The fix: use `BaseHook` for hook entrypoints and `SafeCallback` for `unlockCallback`. Together, they enforce caller checks on the callback paths they cover:

```solidity
modifier onlyPoolManager() {
    if (msg.sender != address(poolManager))
        revert NotPoolManager();
    _;
}
```

_Figure 5: onlyPoolManager restricts hook callbacks to the configured PoolManager._

Add an equivalent caller check only on paths those contracts don’t cover.

**Real-world example:** The [Cork exploit](https://www.cork.tech/blog/post-mortem) (~$12M, May 2025) shows why this check matters. Cork let data from an untrusted path reach hook logic that affected redemptions. That access-control gap, combined with a pricing issue elsewhere in the protocol, gave the attacker a way to drain funds.

## 2. Treating any pool as legitimate

Pool creation through the PoolManager is permissionless by default. Unless your hook restricts initialization in beforeInitialize, anyone can create a pool with your hook address attached. If your hook trusts a user-supplied `PoolKey` without validation, an attacker can route your logic through a malicious pool with currencies and parameters they choose.

An attacker-created pool presents two immediate risks. First, if your hook stores per-pool data keyed by `PoolId`, the new pool gets its own mapping slot. The attacker can influence values written through activity in that pool, and later accounting paths may treat those values as trusted. Second, `currency0` and `currency1` are attacker-chosen currencies. If either is an ERC-20, token interactions can trigger malicious behavior or reenter other hook functions mid-flow.

The fix: bind your hook to canonical pools during deployment or trusted configuration, or maintain a strict allowlist. Re-check the derived `PoolId` on every user-controlled path:

```solidity
// Pseudocode for pool binding
PoolId poolId = key.toId();
if (!allowedPools[poolId]) revert InvalidPool();
```

_Figure 6: Derive the PoolId from the supplied PoolKey and reject pools that are not allowlisted._

**Real-world example:** In Semantic Layer’s [SVFHook finding](https://solodit.cyfrin.io/issues/chat-points-manipulation-by-adding-liquidity-to-custom-pools-via-svfhook-contract-spearbit-none-semantic-layer-pdf), the `addLiquidity` function lets callers specify the `PoolKey`. An attacker could route deposits through a custom WETH/SVF pool with a malicious hook and earn points at a lower cost than intended.

## 3. Custom accounting leaks value

In v4, a delta is a signed currency-balance change owed to or from the PoolManager. Once your hook touches deltas, a wrong sign, a rounding error, or mixing balance buckets can silently leak value. These bugs are subtle because settlement only checks that the session’s currency deltas resolve; it does not validate the hook’s internal accounting. A hook’s accounting can still be wrong even when settlement succeeds.

Return-delta hooks can move beyond fee bookkeeping. If a `BeforeSwapDelta` consumes the user’s entire specified amount, the PoolManager has no amount left for its concentrated-liquidity swap; the hook supplies the trade instead. This is often called a NoOp swap. Treat that hook as a custom AMM: test conservation, price bounds, rounding, and returned deltas against real balances.

Dynamic fees are also price-sensitive. A dynamic-fee pool can accept a per-swap fee override from `beforeSwap`, and its hook can update the stored LP fee. Bound every fee, limit how quickly privileged changes can move it, and do not derive it directly from inputs an attacker can cheaply manipulate.

For hooks that move value, test at least these three accounting invariants:

- No user receives output that the accounting did not charge for.
- A same-transaction round trip cannot create value from accounting alone.
- Internal accounting matches actual asset balances.

Those invariants must also hold for the tokens the hook handles. Fee-on-transfer tokens can make the amount received smaller than the amount sent; rebasing tokens can change balances without a transfer; callback-enabled tokens can reenter; and pausable or blacklistable tokens can block settlement. State which behaviors you support and test accounting against observed balance changes.

The fix: keep LP funds, fees, and incentives in separate buckets. Label every balance and delta, including who owns it, and who can move it.

**Real-world example:** The [Bunni exploit](https://blog.bunni.xyz/posts/exploit-post-mortem/) ($8.4M, September 2025) was a rounding bug in BunniHook’s idle-balance accounting. The attacker pushed a pool’s price tick with a flash loan, then made 44 tiny withdrawals that each shrank the active balance disproportionately to the shares burned, eventually extracting profit from the affected pools. Each transaction satisfied the PoolManager’s settlement invariant because the bug was in BunniHook’s internal accounting.

## 4. Right logic, wrong hook

![Figure 7: PoolManager runs beforeSwap before executing the swap and afterSwap afterward when the corresponding address flags are set.](../../assets/posts/building-secure-uniswap-v4-hooks/uniswapv4-figure-7.webp)

_Figure 7: PoolManager runs beforeSwap before executing the swap and afterSwap afterward when the corresponding address flags are set._

The `beforeSwap` hook executes with pre-swap state, but the `afterSwap` hook sees post-swap state. Code that’s correct in one hook can be unsafe in another.

The same timing problem affects liquidity callbacks. In this [`LiquidityPenaltyHook` finding](https://solodit.cyfrin.io/issues/jit-liquidity-penalty-can-be-bypassed-openzeppelin-none-openzeppelin-uniswap-hooks-v110-rc-1-audit-markdown), a JIT-liquidity penalty was computed during `afterRemoveLiquidity`, but a user could first make a tiny liquidity increase that collected the fees separately. By the time removal ran, the hook saw no fees left to penalize.

In our hook audits, we’ve repeatedly observed developers put logic that needs the final swap result in `beforeSwap` instead of `afterSwap`. The code looks correct in isolation, but it’s operating on stale data.

The fix: verify your logic is in the correct hook for the state it needs.

## 5. Address bits are part of the API

In v4, the hook address itself encodes which hook functions the PoolManager will call. This design makes the deployed address part of a hook’s API, so developers must keep its permission bits in sync with the functions they implement.

```solidity
function hasPermission(IHooks self, uint160 flag) internal pure returns (bool) {
    return uint160(address(self)) & flag != 0;
}
```

_Figure 8: hasPermission reads callback permissions from the hook address bits ([v4-core/src/libraries/Hooks.sol](https://github.com/Uniswap/v4-core/blob/main/src/libraries/Hooks.sol))._

Three permission mismatches can cause problems:

- Callback bit set + callback missing → **transaction reverts**.
- Callback implemented + callback bit missing → **PoolManager does not call it**.
- Return-delta bit missing → **PoolManager may call the callback but treat its returned delta as zero**.

For example, if the `afterSwapReturnDelta` bit is missing, your hook might record a fee even though the PoolManager ignored the returned delta.

Address bits do not make the hook’s behavior immutable. If a pool’s hook address points to a proxy, the permission bits stay fixed while an upgrade can change the code reached through that address. Review the upgrade admin, delay, storage layout, and implementation checks as part of the hook’s security boundary. Prefer immutable, versioned deployments when possible.

The fix: inherit from `BaseHook` and keep `getHookPermissions()` in sync with the callbacks and return deltas your hook actually uses. `BaseHook` validates that the deployed address bits match those declared permissions.

**Real-world example:** In the [Sorella Angstrom finding](https://solodit.cyfrin.io/issues/all-swaps-will-revert-if-the-dynamic-protocol-fee-is-enabled-since-hook-configsol-does-not-encode-the-afterswapreturndelta-permission-cyfrin-none-sorella-l2-angstrom-markdown), the hook returned a non-zero delta for the dynamic protocol fee, but `hook-config.sol` did not encode the `afterSwapReturnDelta` permission. The PoolManager wasn’t authorized to settle the delta, so every swap reverted with `CurrencyNotSettled()` once the fee was enabled.

## 6. Hook failures can block pool actions

Hook callbacks execute in the same transaction as the pool action. If reward distribution, dust cleanup, or other non-essential code reverts inside an `afterRemoveLiquidity` callback, users cannot exit their positions. The same applies to swaps when non-essential code reverts inside `afterSwap`. The PoolManager preserves atomic execution by reverting the parent action, so hook developers must keep optional logic from blocking core user flows.

Required external reads can cause the same denial of service. If a price feed rejects stale data, a lending protocol pauses, or another dependency reverts, the callback can revert the user’s swap or withdrawal. For each dependency, decide which paths must fail closed and which can degrade without blocking safe exits. Never silently use stale pricing data.

External calls are not the only source of failure. In our hook audits, we’ve seen happy-path accounting block withdrawals because of a zero balance, decimal mismatch, or missing reward token.

The fix: keep non-essential code out of the main user flow. Wrap optional external calls in `try`/`catch`, or move optional logic to a separate function users can call after exiting. For safety-critical dependencies, validate freshness and bounds, and provide an explicit exit-safe fallback when the design permits one.

## 7. State can change during a callback sequence

When enabled, `beforeSwap` and `afterSwap` run during the same swap, but values cached between them are not automatically safe. A hook can call external contracts, and one hook contract can serve many pools. Nested actions can therefore change shared hook storage, pool state, balances, or oracle data before the outer callback sequence finishes.

The fix: avoid shared scratch state. If data must cross callbacks, key it by `PoolId` and caller, reject overlapping operations while that state is live, and clear it after use. Apply checks-effects-interactions before external calls, and test nested swaps and liquidity changes across multiple pools that share the hook.

## Building secure hooks

If you’re developing a v4 hook, verify these eight items:

1. **Gate every callback and unlock path:** Use `BaseHook` for hook entrypoints and `SafeCallback` for `unlockCallback`. Add equivalent caller checks only on uncovered paths.
2. **Allowlist pools, not just tokens:** Bind to specific `PoolKey` values or maintain strict allowlists.
3. **Label every balance and delta**: Document who owns it, who can move it, and which token behaviors the accounting supports.
4. **Keep LP funds, fees, and incentives separate:** Don’t mix balance buckets.
5. **Keep non-essential code away from the main user flow**: Reward, oracle, and cleanup failures shouldn’t block safe exits.
6. **Verify address permissions:** Inherit from `BaseHook` and confirm that the address bits match your declared permissions. If the hook is upgradeable, review its proxy and upgrade controls separately.
7. **Fuzz nested callbacks, fee extremes, malicious pools, and malicious or non-standard tokens:** Use Echidna and Medusa to test adversarial scenarios, not just happy paths.
8. **Isolate callback state**: Key temporary data by `PoolId` and caller, reject overlapping operations, and clear it after use.

## Auditing v4 hooks

If you’re reviewing a v4 hook, ask these seven questions:

1. **Can an attacker call a callback directly?** Check every external function for access control.
2. **Can an attacker route logic through a malicious pool?** Trace how `PoolKey` values are validated.
3. **Who owns each balance and delta, and can a return delta or dynamic fee leak value?** Test conservation, price bounds, and fee limits.
4. **What happens if reward, cleanup, or oracle code reverts during removeLiquidity?** Test failure paths and dependency outages.
5. **Do the permission bits, implemented functions, returned values, and any proxy upgrade path all match?** Verify the address flags and upgrade controls.
6. **What breaks if the hook, token, or fee input is malicious?** Assume adversarial counterparties.
7. **Can state change between callbacks?** Test nested actions across multiple pools that share the hook.

## Security responsibilities for hook developers

The PoolManager enforces v4’s protocol-level guarantees, including pool mechanics and settlement. Hook developers secure the application-specific logic they add, including authorization, pool selection, value accounting, and external integrations.

Ask which assumptions the hook adds beyond the PoolManager’s guarantees. For operational guidance beyond code review, see Uniswap’s [v4 Security Framework](https://developers.uniswap.org/docs/protocols/v4/security).

If you’re building on Uniswap v4 and want help reviewing your hooks, [reach out to Trail of Bits](https://www.trailofbits.com/contact). And if you’re interested in smart contract security, check out our [public tools and research](https://github.com/trailofbits).

_This post is based on a [presentation I gave at EthCC\[9\]](https://www.youtube.com/watch?v=F4QjFySPS_0). You can find me on X at [@nisedo\_](https://x.com/nisedo_)._
