---
title: '二分查找的几种变体实现'
description: '深入理解二分查找算法的不同应用场景'
pubDate: '2025-07-28'
heroImage: '../../../assets/cover.svg'
category: '算法'
readingTime: 7
tags: ['算法', '二分查找', '数据结构', '编程']
---

二分查找是计算机科学中最经典的算法之一，其核心思想是“对半查找”。它能以对数时间复杂度 O(
logn) 在有序数组中快速定位元素，但其变体在实际应用中更具价值。掌握这些变体，能够帮助你优雅地解决许多复杂问题。

## 标准二分查找

标准二分查找的目标是找到目标值任意一个匹配的索引。如果数组中存在多个目标值，它不保证返回哪个。

```rust
// 返回值为 Option<usize>，用于表示找到目标值时的索引
fn binary_search(nums: &Vec<i32>, target: i32) -> Option<usize> {
    // 初始化查找范围的左右边界
    let mut left: usize = 0;
    let mut right: usize = nums.len(); // 由于右边界是开区间，因此可以直接使用 len()表示

    // 循环条件：当左边界不等于右边界时，循环继续
    // left < right 确保了我们总有一个有效的查找范围
    while left < right {
        // 计算中间索引
        // 这个写法 (left + (right - left) / 2) 比 (left + right) / 2 更安全，
        // 可以避免在 left 和 right 都非常大时可能发生的整数溢出。
        let mid = left + (right - left) / 2;

        // 比较中间元素与目标值
        // nums[mid] 是通过 mid 索引访问 Vec 中的元素。
        if nums[mid] == target {
            // 如果找到目标，我们使用 Option<usize> 类型返回 Some(mid)
            return Some(mid);
        } else if nums[mid] < target {
            // 如果中间元素太小，说明目标在右半边，移动左边界
            left = mid + 1;
        } else {
            // 如果中间元素太大，说明目标在左半边，移动右边界
            // 注意这里是 `mid` 而不是 `mid - 1`，因为 `mid` 处的值已经检查过了，
            // 且我们的 `right` 是开区间。
            right = mid;
        }
    }

    // 循环结束，意味着没找到目标值，返回 None
    None
}
```

## 查找左边界（第一个出现的元素）

当你需要找到一个元素第一次出现的位置时，标准二分查找就不够了。例如，在 [1, 2, 2, 2, 3] 中查找 2，你希望得到索引 1。

核心思路：当 nums[mid] 等于 target 时，不要立即返回。而是收缩右边界 right = mid - 1，继续向左查找，直到 left > right。最终的 left 值就是左边界。

```rust
fn left_bound(nums: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = nums.len() - 1;
    let mut res: Option<usize> = None;

    while left <= right {
        let mid = left + (right - left) / 2;
        if nums[mid] == target {
            // 找到一个可能的结果，继续向左查找
            res = Some(mid);
            right = mid - 1;
        } else if nums[mid] < target {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    res
}
```

## 查找右边界（最后一个出现的元素）

同理，如果你需要找到一个元素最后一次出现的位置，就需要使用查找右边界的变体。例如，在 [1, 2, 2, 2, 3] 中查找 2，你希望得到索引 3。

核心思路：当 nums[mid] 等于 target 时，我们收缩左边界 left = mid + 1，继续向右查找，直到 left > right。最终的 right 值（或者更精确地说，是 left - 1）就是右边界。

```rust
fn right_bound(nums: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = nums.len() - 1;
    let mut res: Option<usize> = None;

    while left <= right {
        let mid = left + (right - left) / 2;
        if nums[mid] == target {
            // 找到一个可能的结果，继续向右查找
            res = Some(mid);
            left = mid + 1;
        } else if nums[mid] < target {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    res
}
```

## 应用场景

1. **搜索插入位置**：当 left_bound 查找一个不存在的元素时，返回的 left 值就是该元素应该被插入的位置，以保持数组的有序性。

2. **搜索范围**：结合 left_bound 和 right_bound，你可以轻松找到一个目标值在数组中出现的完整范围。

3. **峰值查找**：虽然这通常不是一个标准的二分查找问题，但在单调递增再单调递减的山脉数组中，可以通过二分查找的思想高效地找到峰值。

## 总结

二分查找看似简单，但其变体能够解决更广泛的问题。其精髓在于边界条件的微调。标准查找的边界收缩是 left = mid + 1 或 right = mid - 1，而变体则会根据目标（如查找左边界或右边界）来调整。
