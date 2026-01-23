---
title: 'cs61A-study-lecture2'
description: '函数即抽象'
pubDate: '2026-01-21'
heroImage: '../../assets/cover.svg'
category: 'study'
series: ''
tags: ['coding', 'python', 'study']
---

# 数字表达式

三种表示方法：前缀，中缀，后缀

其中后缀计算机处理起来最快，中缀是对人阅读体验最好的一种

# 局部帧（Local frame）

局部帧是堆栈帧这个数据结构的“实例”，内含函数临时变量参数返回地址等信息，每个实例的局部帧都是不同的，唯一的

类似于菜单与做菜和菜的关系，菜单是一个模板，做菜是一个实例，每次做菜时的菜都是唯一的

# 函数文档

在定义函数时通常会包含描述该函数的文档，称为文档字符串（docstring）。它必须与函数体一起缩进。按照惯例，文档字符串通常使用三引号括起来。第一行用一句话描述函数的功能，随后的段落可以详细说明参数并澄清函数的行为：

``` python
def pressure(v, t, n):
    """计算理想气体的压力（单位：帕斯卡）

    使用理想气体定律：http://en.wikipedia.org/wiki/Ideal_gas_law

    v -- 气体体积，单位：立方米
    t -- 绝对温度，单位：开尔文
    n -- 气体粒子数
    """
    k = 1.38e-23  # 玻尔兹曼常数
    return n * k * t / v
```

当以定义的函数名为参数调用help函数时，会打印出文档字符串

``` zsh
>>> help(pressure)
Help on function pressure in module __main__:

pressure(v, t, n)
    计算理想气体的压力（单位：帕斯卡）

    使用理想气体定律：http://en.wikipedia.org/wiki/Ideal_gas_law

    v -- 气体体积，单位：立方米
    t -- 绝对温度，单位：开尔文
    n -- 气体粒子数
```
