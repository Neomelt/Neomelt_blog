---
title: 'Rust入门指南'
description: '从零开始学习Rust编程语言的基础知识和核心概念'
pubDate: '2025-08-16'
heroImage: '../../assets/cover.svg'
category: 'coding'
tags: ['Rust', 'study']
---

## Rust入门指南

Rust是一门注重安全性、速度和并发性的系统编程语言。本文将介绍Rust的基础知识。

### 为什么选择Rust？

- **内存安全**：通过所有权系统防止内存泄漏
- **零成本抽象**：高级特性不会带来运行时开销  
- **无畏并发**：强大的并发编程支持

### 基础语法

```rust
fn main() {
    println!("Hello, world!");
}
```

### 所有权系统

Rust的所有权系统是其最独特的特性之一：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1的所有权转移给s2
    // println!("{}", s1); // 这里会编译错误
    println!("{}", s2);
}
```

Rust是一门值得深入学习的现代系统编程语言！
