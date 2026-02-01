---
title: '用rust写CRC库'
description: 'CRC算法的rust实现'
pubDate: '2025-2-1'
pinned: true
heroImage: '../../assets/cover.svg'
category: 'coding'
series: ''
tags: ['crc', "rust"]
---

## CRC8

crc算法涉及到很多位运算的知识，前几天正好大致学了csapp，学了一堆位运算，联想起来接触了好久的CRC算法。以往都是写来直接用现在正好写来玩玩。

``` rust

// crc8 实现
// 多项式：x^8 + x^5 + x^4 + 1 (0x31) 0x31 = 1 0011 0001,1可以省略，因为最高位总是1
// input: &[u8] - 输入数据
// output: u8 - 计算得到的 CRC8 校验值
// 初始值：0xFF
// 反射输入和输出：否
// 异或输出：0x00
// 示例用法：let crc = crc8(&[0x01, 0x02, 0x03]);
pub fn crc8(input: &[u8]) -> u8 {
    let polynomial: u8 = 0x31;
    let mut crc: u8 = 0xFF;

    for &byte in input {
        crc ^= byte;
        for _ in 0..8 {
            if (crc & 0x80) != 0 {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc <<= 1;
            }
        }
    }

    crc
}

```


## CRC16

``` rust

//
// CRC16 实现
// 多项式：x^16 + x^15 + x^2 + 1 (0x8005) 的反转形式为 0xA001
// input: &[u8] - 输入数据
// output: u16 - 计算得到的 CRC16 校验值
// 初始值：0xFFFF
// 反射输入和输出：是
// 异或输出：0x0000
// 示例用法：let crc = crc16(&[0x01, 0x02, 0x03]);

pub fn crc16(input: &[u8]) -> u16 {
    let polynomial: u16 = 0xA001; // 0xA001 是 0x8005 的反转形式
    let mut crc16: u16 = 0xFFFF; // 初始值

    for &byte in input {
        crc16 ^= byte as u16;
        for _ in 0..8 {
            if (crc16 & 0x0001) != 0 {
                crc16 = (crc16 >> 1) ^ polynomial;
            } else {
                crc16 >>= 1;
            }
        }
    }

    crc16
}

```


在main.rs里面调用（如果说是要在外部调用crate的话还要在cargo.toml里写明crate_name）：

``` rust

use crc_rs::{crc8, crc16};

fn main()
{
    let data = [0x01, 0x02, 0x03];
    let crc8 = crc8(&data);
    let crc16 = crc16(&data);
    println!("CRC8: 0x{:02X}", crc8); // 输出 CRC8 校验值为 0x87
    println!("CRC16: 0x{:04X}", crc16); // 输出 CRC16 校验值为 0x6161
}

```