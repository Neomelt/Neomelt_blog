---
title: 'Rust入门指南'
description: '从所有权到错误处理，系统梳理 Rust 核心概念'
pubDate: '2025-08-16'
heroImage: '../../assets/cover.svg'
category: 'coding'
tags: ['Rust', 'study']
---

用了一段时间 Rust 之后，想把核心概念整理一遍。这篇文章不是语法手册，而是帮你建立对 Rust 的直觉——尤其是所有权这套东西，理解了它，Rust 就通了一大半。

## 为什么是 Rust？

Rust 解决的核心问题是：**在没有垃圾回收的情况下保证内存安全**。

C/C++ 让你手动管理内存，性能极高，但悬空指针、double free、数据竞争这些问题防不胜防。GC 语言（Go、Java、Python）解决了安全问题，但运行时开销和 GC 停顿是绕不开的代价。

Rust 的答案是把内存管理的规则编译进类型系统，让编译器在编译期替你检查，运行时零开销。代价是学习曲线陡。

## 所有权：Rust 的核心

Rust 里每个值有且只有一个**所有者**（owner）。所有者离开作用域，值就被释放。

```rust
{
    let s = String::from("hello"); // s 是这个字符串的所有者
    // 使用 s
} // s 离开作用域，字符串内存被释放
```

**所有权转移（Move）**

把值赋给另一个变量，所有权转移，原变量失效：

```rust
let s1 = String::from("hello");
let s2 = s1;           // 所有权转移给 s2
// println!("{}", s1); // 编译错误：s1 已经无效
println!("{}", s2);    // 正常
```

这就是 Rust 防止 double free 的方式——同一块内存永远只有一个所有者。

**Clone：显式深拷贝**

如果确实需要两份数据，用 `.clone()`：

```rust
let s1 = String::from("hello");
let s2 = s1.clone(); // 深拷贝，两者独立
println!("{} {}", s1, s2); // 都有效
```

**Copy 类型**

整数、浮点数、布尔、字符这些存在栈上的类型实现了 `Copy` trait，赋值时自动复制，不会转移所有权：

```rust
let x = 5;
let y = x;               // 复制，不是移动
println!("{} {}", x, y); // 都有效
```

## 借用：临时使用，不拿走

大多数时候你不想转移所有权，只是想用一下。用引用（`&`）来借用：

```rust
fn print_len(s: &String) {
    println!("长度: {}", s.len());
}

let s = String::from("hello");
print_len(&s);     // 借用给函数，s 的所有权没有转移
println!("{}", s); // s 仍然有效
```

**可变借用**

默认借用是只读的。要修改，需要可变借用 `&mut`：

```rust
fn add_world(s: &mut String) {
    s.push_str(", world");
}

let mut s = String::from("hello");
add_world(&mut s);
println!("{}", s); // "hello, world"
```

**借用规则**

Rust 在编译期强制执行两条规则：

1. 同一时刻，要么只有一个可变借用，要么有任意多个不可变借用
2. 引用必须始终有效（不能有悬空引用）

```rust
let mut s = String::from("hello");

let r1 = &s;
let r2 = &s;      // 多个不可变借用，没问题
// let r3 = &mut s; // 编译错误：不能同时存在可变和不可变借用

println!("{} {}", r1, r2);
// r1, r2 最后使用完毕，之后可以创建可变借用
let r3 = &mut s;
r3.push('!');
```

这套规则在编译期消灭了数据竞争。

## 枚举和模式匹配

Rust 的枚举比其他语言强大得多，每个变体可以携带不同类型的数据：

```rust
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Triangle { base: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r)                    => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h)              => w * h,
        Shape::Triangle { base, height }    => 0.5 * base * height,
    }
}
```

`match` 必须穷举所有变体，漏掉一个编译不过——这个特性在你添加新枚举变体时会提醒你更新所有相关处理逻辑，非常实用。

## 错误处理：Option 和 Result

Rust 没有 null，没有异常，用类型来表达"可能缺失"和"可能失败"。

**Option：值可能不存在**

```rust
fn find_first_even(nums: &[i32]) -> Option<i32> {
    for &n in nums {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

match find_first_even(&[1, 3, 4, 7]) {
    Some(n) => println!("找到了: {}", n),
    None    => println!("没有偶数"),
}
```

**Result：操作可能出错**

```rust
use std::fs;

fn read_config(path: &str) -> Result<String, std::io::Error> {
    fs::read_to_string(path)
}

match read_config("config.toml") {
    Ok(content) => println!("{}", content),
    Err(e)      => eprintln!("读取失败: {}", e),
}
```

**`?` 运算符：错误传播的语法糖**

在返回 `Result` 的函数内，`?` 会在出错时提前返回错误：

```rust
fn process() -> Result<(), std::io::Error> {
    let content = fs::read_to_string("a.txt")?; // 出错则直接返回 Err
    let more    = fs::read_to_string("b.txt")?;
    println!("{}{}", content, more);
    Ok(())
}
```

相比手动 `match` 每个结果，`?` 让错误处理代码简洁很多。

## Trait：定义共同行为

Trait 类似其他语言的接口，定义类型必须实现的方法：

```rust
trait Describe {
    fn describe(&self) -> String;
}

struct Dog { name: String }
struct Cat { name: String }

impl Describe for Dog {
    fn describe(&self) -> String {
        format!("{} 是一只狗", self.name)
    }
}

impl Describe for Cat {
    fn describe(&self) -> String {
        format!("{} 是一只猫", self.name)
    }
}

fn print_info(animal: &impl Describe) {
    println!("{}", animal.describe());
}
```

标准库里有很多常用 trait，比如 `Display`（格式化输出）、`Iterator`、`From`/`Into`，实现它们就能融入 Rust 生态。

## 接下来

理解了所有权和借用，你对 Rust 的基础心智模型就建立起来了。建议的学习路径：

- **[The Book](https://doc.rust-lang.org/book/)** — 官方教程，质量极高，适合系统学习
- **Rustlings** — 通过修复小练习来熟悉语法，适合动手党
- 找个实际项目练手，哪怕是写个命令行小工具，遇到编译器报错再查文档，进步最快

Rust 的学习曲线主要在前期跟编译器"吵架"，但过了那个阶段你会发现，编译器拦下来的那些错误，在其他语言里都是运行时 bug。
