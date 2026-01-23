---
title: 'cs61A-study-lecture4'
description: 'Higher-older functions'
pubDate: '2026-01-23'
heroImage: '../../assets/cover.svg'
category: 'study'
series: ''
tags: ['coding', 'python', 'study', 'cs61A']
---

# 高阶函数

普通函数处理数字，高阶函数处理逻辑

我们通常在设计函数的时候会出现很多类似逻辑的函数

比如求解立方根和平方根，两个函数唯一不同的可能只有函数名和计算式，所以python有一种写法就是：

``` python
def summation(n, term):
    """一个通用的求和‘模板’。
    n: 上界
    term: 一个函数，用来计算第 k 项的值
    """
    total, k = 0, 1
    while k <= n:
        total = total + term(k) # term(k) 就是那个“槽位”
        k = k + 1
    return total

def cube(x):
    return x * x * x

def square(x):
    return x * x

# 使用模板计算 1 到 10 的立方和
result1 = summation(10, cube)
result2 = summation(10, square)
print(result1, result2)  # 输出 3025 385
```

# 柯里化

柯里化是一种将多变量输入函数通过嵌套函数的方式简化为通过系数的思维的单输入的函数

``` python
# 普通函数
def add(x, y):
    return x + y

# 柯里化版本
def curried_add(x):
    def inner(y):
        return x + y
    return inner

# 调用方式
print(add(5, 3))          # 一次性给齐
print(curried_add(5)(3))  # 分两次给，第一个括号返回的是一个函数
```

# Lambda 表达式

Lambda 表达式在python中被称为匿名函数，通常用于一次性使用的函数，不想起函数名但又需要的情况

其函数定义为：

$$\text{lambda} \quad \text{arguments} : \text{expression}$$

- 关键字 lambda：声明这是一个匿名函数。

- 参数 (arguments)：可以有多个，用逗号隔开，也可以没有参数。

- 冒号 :：分割参数和函数体。

- 表达式 (expression)：只能有一行。这个表达式的计算结果会自动作为返回值（不需要写 return）。

> Lambda很酷，但还是尽量少用，简短不是代码的目标，可读性高才是


**常见的应用场景**

1. 作为高阶函数的参数
这是 Lambda 最辉煌的舞台。当你调用类似 sorted()、map() 或 filter() 这种需要传入逻辑的函数时，Lambda 非常方便。

    ``` python
    # 按照元素的绝对值大小进行排序
    nums = [1, -5, 3, -2, 4]
    sorted_nums = sorted(nums, key=lambda x: abs(x))
    # 结果：[1, -2, 3, 4, -5]
    ```

2. 配合柯里化（Currying）

    如我们之前讨论的，Lambda 是实现“系数思维”的利器：

    ``` python
    # 一个产生乘法器的工厂
    make_multiplier = lambda n: lambda x: x * n

    double = make_multiplier(2)
    print(double(10)) # 20
    ```

# 函数装饰器

装饰器（Decorator）是 Python 中最优雅也最强大的语法之一。简单来说，它是一种“在不修改原函数代码的前提下，给函数增加新功能”的工具，是python语言中的语法糖。

**常见 Python 内置装饰器**：

| 装饰器                | 作用说明                                                         |
|----------------------|------------------------------------------------------------------|
| `@property`          | 把一个方法变成“属性”来调用（不用加括号）                         |
| `@staticmethod`      | 声明一个静态方法。                                               |
| `@classmethod`       | 声明一个类方法。                                                 |
| `@functools.lru_cache` | 非常强大！自动为函数增加缓存功能（备忘录模式），递归速度提升显著。 |

其他装饰器一般会由第三方库提供或者自己手写

一些示例：

计算斐伯拉契数列

``` python
from functools import lru_cache

@lru_cache(maxsize=None)  # 系统内置：自动缓存计算结果
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

# 没加装饰器前，fib(40) 可能要跑好几秒
# 加了之后，fib(40) 瞬间出结果！
print(fib(40))
```

加了这行就会让代码记住自己之前算的数据，而不是去重复计算，这行代码将复杂度从($O(2^n)$)降到了($O(n)$)，这种思想叫做**动态规划(Dynamic Programming)**。
