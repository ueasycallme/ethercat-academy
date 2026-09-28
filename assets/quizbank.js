/* 由 _build_quizbank.py 从各课 quiz-data 生成，不要手改 */
window.ACADEMY_QUIZBANK = {
 "sources": "5276c7a6372ff167dcb9399830a8977b31dcb7c49b777db07e9324e3e3ddbbc3",
 "count": 96,
 "questions": [
  {
   "id": "u0-l1#1",
   "lesson": "u0-l1",
   "q": "目标位置 <code>607A</code> 被装进 LRW 帧，是在总图的哪一层？",
   "options": [
    "实时周期循环",
    "主站协议栈",
    "网卡驱动",
    "ESC 从站控制器"
   ],
   "answer": 1,
   "explain": "实时循环只把值写进域内存里 607A 的位置；组帧（把整个过程映像装进 LRW 数据报）是主站协议栈的工作，网卡驱动只负责把帧发出去。"
  },
  {
   "id": "u0-l1#2",
   "lesson": "u0-l1",
   "q": "<code>ethercat slaves</code> 显示 OP，但电机不动、<code>6041</code> 显示 Switch On Disabled。最合理的解释是？",
   "options": [
    "网线接错端口",
    "ESM 和 CiA402 是两台独立状态机，总线到 OP 不代表驱动器已使能",
    "从站没有 DC",
    "主站协议栈没有发帧"
   ],
   "answer": 1,
   "explain": "OP 只说明 ESM 走完、过程数据在交换；驱动器还要主站通过 6040 依次发 Shutdown、Switch On、Enable Operation 才会进入 Operation Enabled。"
  },
  {
   "id": "u0-l1#3",
   "lesson": "u0-l1",
   "q": "EtherType <code>0x88A4</code> 说明了什么？",
   "options": [
    "这是一个 IPv4 包",
    "这是一个 UDP 包，端口 0x88A4",
    "以太网载荷直接就是 EtherCAT 协议，不经过 IP/TCP",
    "这是 VLAN 标签"
   ],
   "answer": 2,
   "explain": "EtherCAT 直接放在以太网帧里，EtherType 0x88A4 标识它，后面紧跟 EtherCAT 头与数据报，没有 IP 与 TCP 层。"
  },
  {
   "id": "u0-l1#4",
   "lesson": "u0-l1",
   "q": "实际位置 <code>6064</code> 回到主站的路径，哪一个顺序是对的？",
   "options": [
    "编码器 → 电机控制 → CiA402 驱动器 → 从站协议栈 → ESC → 网线 → 主站协议栈 → CiA402 主站侧",
    "编码器 → ESC → 电机控制 → 网线 → 规划器",
    "编码器 → 网卡驱动 → ESC → 主站协议栈",
    "编码器 → 从站协议栈 → 邮箱 SM1 → 主站"
   ],
   "answer": 0,
   "explain": "回程是去程的镜像：从站侧自上而下到 ESC，过网线，主站侧自下而上。6064 走的是过程数据（SM3 输入），不是邮箱。"
  },
  {
   "id": "u1-l1#1",
   "lesson": "u1-l1",
   "q": "四个端口都启用的 ESC，帧的处理顺序是？",
   "options": [
    "0 → 处理单元 → 1 → 2 → 3 → 0",
    "0 → 处理单元 → 3 → 1 → 2 → 0",
    "0 → 1 → 2 → 3 → 处理单元 → 0",
    "按端口收到链路的先后顺序"
   ],
   "answer": 1,
   "explain": "处理单元挂在端口 0 的接收路径上，之后按 3 → 1 → 2 → 0 依次转发（ET1100 数据手册的帧处理顺序）。端口 3 排在端口 1 前面，是最容易记错的地方。"
  },
  {
   "id": "u1-l1#2",
   "lesson": "u1-l1",
   "q": "线形接线的最后一台从站，端口 1 没有接网线。帧到了它那里会怎样？",
   "options": [
    "帧被丢弃，主站超时",
    "从站生成一个新的应答帧发回主站",
    "端口 1 自动闭合，同一帧在芯片内部转到回程方向，经端口 0 发回",
    "帧停在从站里等下一个周期"
   ],
   "answer": 2,
   "explain": "Auto 回环模式下，无链路的端口自动闭合。帧不被丢弃也不被重新生成，是同一帧掉头走回程线对。"
  },
  {
   "id": "u1-l1#3",
   "lesson": "u1-l1",
   "q": "帧在回程路上再次经过从站 2 时，从站 2 会做什么？",
   "options": [
    "再处理一次，WKC 再加一次",
    "只从端口 1 收进来、经端口 2（闭合）转到端口 0 发出，不经过处理单元",
    "把帧里的数据恢复成去程时的样子",
    "丢掉帧里已经处理过的数据报"
   ],
   "answer": 1,
   "explain": "只有从端口 0 收进来的帧才经过处理单元。回程帧从端口 1 进入，按 1 → 2 → 0 的顺序只转发。"
  },
  {
   "id": "u1-l1#4",
   "lesson": "u1-l1",
   "q": "某台从站 DL Status 读到 bit 5 = 0、bit 10 = 1、bit 11 = 0。说明什么？",
   "options": [
    "端口 1 无物理链路且已闭环：它是线形末端，或它后面的网线断了",
    "端口 0 断了，主站连不上它",
    "它的 EEPROM 没加载",
    "端口 1 正常通信"
   ],
   "answer": 0,
   "explain": "bit 5 是端口 1 物理链路，bit 10 是端口 1 回环闭合，bit 11 是端口 1 通信。如果这台本不该是最后一台，就沿它的端口 1 往下找断线。"
  },
  {
   "id": "u1-l2#1",
   "lesson": "u1-l2",
   "q": "EtherCAT 帧的 EtherType 是多少？",
   "options": [
    "<code>0x0800</code>",
    "<code>0x88A4</code>",
    "<code>0x88F7</code>",
    "<code>0x8100</code>"
   ],
   "answer": 1,
   "explain": "<code>0x88A4</code> 是 EtherCAT 的 EtherType，帧不经过 IP/TCP。<code>0x0800</code> 是 IPv4，<code>0x88F7</code> 是 PTP，<code>0x8100</code> 是 VLAN 标签。"
  },
  {
   "id": "u1-l2#2",
   "lesson": "u1-l2",
   "q": "EtherCAT 头的 16 位值是 <code>0x1022</code>，说明什么？",
   "options": [
    "Type = 1，后面数据报区共 34 字节",
    "Type = 2，数据报区 0x22 个数据报",
    "Length = 0x1022 字节",
    "Type = 0x10，Length = 0x22"
   ],
   "answer": 0,
   "explain": "bit 0–10 是 Length：0x022 = 34；bit 11 保留；bit 12–15 是 Type：1 = EtherCAT 命令。"
  },
  {
   "id": "u1-l2#3",
   "lesson": "u1-l2",
   "q": "一帧装了 3 个数据报，帧里有几个 WKC，在哪？",
   "options": [
    "1 个，在 FCS 前面",
    "1 个，在 EtherCAT 头里",
    "3 个，每个数据报的数据区之后各一个",
    "3 个，都集中在帧尾"
   ],
   "answer": 2,
   "explain": "WKC 属于数据报：每个数据报 = 10 字节头 + 数据 + 2 字节 WKC，一个接一个排列。"
  },
  {
   "id": "u1-l2#4",
   "lesson": "u1-l2",
   "q": "某数据报的 Len/R/C/M 字是 <code>0x8008</code>，表示？",
   "options": [
    "数据 8 字节，后面还有数据报",
    "数据 0x8008 字节",
    "数据 8 字节，这是最后一个数据报",
    "循环帧标志置位，需要丢弃"
   ],
   "answer": 0,
   "explain": "bit 0–10 = 8 是数据长度；bit 15（M）= 1 表示后面还有数据报；bit 14（C）= 0。"
  },
  {
   "id": "u1-l3#1",
   "lesson": "u1-l3",
   "q": "要用 APRD 读位置 2（第三台）从站的寄存器，ADP 应该填？",
   "options": [
    "<code>0x0002</code>",
    "<code>0xFFFE</code>",
    "<code>0x0003</code>",
    "它的站地址"
   ],
   "answer": 1,
   "explain": "每台从站把 ADP 加 1 再转发，收到 0 的那台处理。填 −2（<code>0xFFFE</code>），经过前两台各加 1 后到第三台正好是 0。"
  },
  {
   "id": "u1-l3#2",
   "lesson": "u1-l3",
   "q": "3 台从站都在线，主站发 BRD 读 <code>0x0130</code>。返回的 WKC 和数据是？",
   "options": [
    "WKC = 1，数据是第一台的 AL 状态",
    "WKC = 3，数据是三台 AL 状态的按位或",
    "WKC = 3，数据是三台 AL 状态之和",
    "WKC = 6，数据是最后一台的 AL 状态"
   ],
   "answer": 1,
   "explain": "广播读时每台都读成功各 +1；每台把自己的值与帧里的数据按位或。"
  },
  {
   "id": "u1-l3#3",
   "lesson": "u1-l3",
   "q": "LRW 数据报里，某台从站既有输出被写、又有输入被读，它对 WKC 的贡献是？",
   "options": [
    "+1",
    "+2",
    "+3",
    "+4"
   ],
   "answer": 2,
   "explain": "读写命令：读成功 +1，写成功 +2，两者都成功 +3。"
  },
  {
   "id": "u1-l3#4",
   "lesson": "u1-l3",
   "q": "<code>ethercat domains</code> 显示 WorkingCounter 4/6，最合理的解读是？",
   "options": [
    "帧里的数据全部正确，只是计数方式不同",
    "有 2 次写或 2 次读没有成功：有从站没参与这次交换",
    "WKC 溢出，可以忽略",
    "主站 CPU 太忙"
   ],
   "answer": 1,
   "explain": "期望 6、实际 4，说明有从站没参与交换，比如线形末端一台只有输出的从站掉线正好少 2。先用 ethercat slaves 看哪台状态不对。"
  },
  {
   "id": "u2-l1#1",
   "lesson": "u2-l1",
   "q": "读 <code>0x0130</code> 得到 0x0014，这表示什么？",
   "options": [
    "从站在 OP，bit4 表示设备标识",
    "从站在 SAFEOP，且错误指示位置 1",
    "从站在 PREOP，正在请求 SAFEOP",
    "主站请求了 SAFEOP 并确认了错误"
   ],
   "answer": 1,
   "explain": "低 4 位 0x4 = SAFEOP，bit4 = 1 是错误指示。下一步读 <code>0x0134</code> 看原因码。选项 D 描述的是写 <code>0x0120</code>=0x0014 的含义，那是 AL Control 不是 AL Status。"
  },
  {
   "id": "u2-l1#2",
   "lesson": "u2-l1",
   "q": "ESC 的过程数据 RAM 从哪个地址开始？",
   "options": [
    "0x0800",
    "0x0900",
    "0x1000",
    "0x2000"
   ],
   "answer": 2,
   "explain": "0x0000–0x0FFF 是 4 KB 寄存器区，0x1000 起才是用户 RAM。0x0800 是 SM 寄存器，0x0900 是 DC 寄存器。"
  },
  {
   "id": "u2-l1#3",
   "lesson": "u2-l1",
   "q": "想知道一台从站的 ESC 有几个同步管理器，读哪个寄存器？",
   "options": [
    "0x0004",
    "0x0005",
    "0x0006",
    "0x0007"
   ],
   "answer": 1,
   "explain": "0x0004 是 FMMU 数，0x0005 是 SM 数，0x0006 是 RAM 大小（KB），0x0007 是端口描述。"
  },
  {
   "id": "u2-l1#4",
   "lesson": "u2-l1",
   "q": "从站停在 SAFEOP+E，主站要确认这个错误，应该怎么做？",
   "options": [
    "向 0x0130 写 0，把错误位清掉",
    "向 0x0134 写 0，清掉状态码",
    "向 0x0120 写入目标状态并同时置 bit4，例如 0x0014",
    "重启主站程序，错误会自动消失"
   ],
   "answer": 2,
   "explain": "0x0130 和 0x0134 由从站侧写，主站写无效。确认错误的唯一入口是 AL Control 的 bit4（Error Ind Ack）。从站清掉错误位后，主站才能再次请求更高状态。"
  },
  {
   "id": "u2-l2#1",
   "lesson": "u2-l2",
   "q": "某 SM 控制字节读出 0x26，它是什么配置？",
   "options": [
    "缓冲模式，主站读",
    "邮箱模式，主站写，AL 事件使能",
    "邮箱模式，主站读，看门狗使能",
    "缓冲模式，主站写，看门狗使能"
   ],
   "answer": 1,
   "explain": "0x26 = 0010 0110b：bit1–0 = 10 邮箱，bit3–2 = 01 主站写，bit5 = 1 AL 事件。这正是 SM0 的惯例值。缓冲模式主站写且带看门狗是 0x64。"
  },
  {
   "id": "u2-l2#2",
   "lesson": "u2-l2",
   "q": "SM0 还是满的，主站又对它写了一次，会发生什么？",
   "options": [
    "新数据覆盖旧请求",
    "ESC 丢弃这次写入，该数据报 WKC 不加，主站稍后重试",
    "ESC 把新数据排队，等固件读完再放进去",
    "从站立即报错退回 INIT"
   ],
   "answer": 1,
   "explain": "邮箱是单缓冲，满时拒绝写入。主站从 WKC 没有增加得知失败，所以不会丢请求，也不会覆盖。"
  },
  {
   "id": "u2-l2#3",
   "lesson": "u2-l2",
   "q": "帧到达时，从站 MCU 还在往 SM3 写新的一份输入 Tx6、尚未写完。这一帧的 LRW 从 SM3 读到什么，WKC 如何？",
   "options": [
    "帧在 ESC 里等 MCU 写完，读到 Tx6，WKC 照常加",
    "读到上一份写完的最新值 Tx5，WKC 照常加",
    "读到写了一半的 Tx6，WKC 照常加",
    "读访问被拒绝，WKC 少加 1"
   ],
   "answer": 1,
   "explain": "三缓冲让双方谁也不等谁：MCU 正写的那块被占用，ESC 把读访问映射到最近写完的那块，所以读到上一份 Tx5，WKC 照样 +1（LRW 合计 +3）。WKC 完整只说明读写发生了，不说明数据新鲜。"
  },
  {
   "id": "u2-l2#4",
   "lesson": "u2-l2",
   "q": "看门狗分频 0x0400 = 2498，0x0420 = 1000，输出多久不刷新从站会判定过期？",
   "options": [
    "1 ms",
    "10 ms",
    "100 ms",
    "1 s"
   ],
   "answer": 2,
   "explain": "时基 (2498 + 2) × 40 ns = 100 µs，乘以 1000 = 100 ms。这是出厂默认值，主站可改写。"
  },
  {
   "id": "u2-l3#1",
   "lesson": "u2-l3",
   "q": "FMMU 类型字节（偏移 +0xB）为 0x02，它用于什么？",
   "options": [
    "输入：从站数据放进帧，主站读",
    "输出：帧里的数据写进从站物理内存",
    "邮箱：映射 SM0",
    "只做位级映射"
   ],
   "answer": 1,
   "explain": "bit1 = 写映射，是主站视角的写，即输出方向。输入用 0x01（读映射）。IgH 正是按方向写 0x01 或 0x02。"
  },
  {
   "id": "u2-l3#2",
   "lesson": "u2-l3",
   "q": "3 台从站，每台都有输入和输出，放在同一个 LRW 域里，WKC 期望值是多少？",
   "options": [
    "3",
    "6",
    "9",
    "12"
   ],
   "answer": 2,
   "explain": "LRW 下每台从站读命中 +1、写命中 +2，读写都命中 +3，3 × 3 = 9。"
  },
  {
   "id": "u2-l3#3",
   "lesson": "u2-l3",
   "q": "从站 2 的 FMMU 窗口是逻辑 0x0C–0x17，LRW 数据报覆盖 0x00–0x23。帧经过从站 2 时，0x00–0x0B 这 12 字节会怎样？",
   "options": [
    "从站 2 原样转发，不读也不写",
    "从站 2 把它们清零",
    "从站 2 把它们拷进自己的 SM2",
    "帧在从站 2 停下，等从站 1 的数据处理完"
   ],
   "answer": 0,
   "explain": "ESC 只处理与自己 FMMU 窗口相交的字节，其余一概原样转发。帧是飞行中处理的，不会停下。"
  },
  {
   "id": "u2-l3#4",
   "lesson": "u2-l3",
   "q": "域 WKC 期望 9，实际读到 7，最可能的原因是？",
   "options": [
    "某台从站的输入没有命中",
    "某台从站的输出没有被接收",
    "整台从站掉线",
    "帧丢失"
   ],
   "answer": 1,
   "explain": "LRW 写命中贡献 2，差 2 正对应一台从站的输出没被接收（例如该从站还没进 OP、输出 SM 未启用）。差 1 是输入，差 3 是整台；帧丢失时 WKC 根本收不回来。"
  },
  {
   "id": "u2-l4#1",
   "lesson": "u2-l4",
   "q": "用 <code>sii_read | hexdump -C</code> 看原始 SII，厂商号从哪个字节偏移开始？",
   "options": [
    "0x08",
    "0x10",
    "0x40",
    "0x80"
   ],
   "answer": 1,
   "explain": "厂商号在字地址 0x0008，字节偏移 = 字地址 × 2 = 0x10，小端存放。0x80 是字 0x0040，即类别区起点。"
  },
  {
   "id": "u2-l4#2",
   "lesson": "u2-l4",
   "q": "SII 字 0x001C 读出 0x000C，这台从站支持哪些邮箱协议？",
   "options": [
    "AoE 和 EoE",
    "CoE 和 FoE",
    "EoE 和 SoE",
    "只有 CoE"
   ],
   "answer": 1,
   "explain": "bit2 = CoE，bit3 = FoE，0x0004 + 0x0008 = 0x000C。"
  },
  {
   "id": "u2-l4#3",
   "lesson": "u2-l4",
   "q": "用 IgH 主站驱动一台新伺服，必须先准备它的 ESI 文件吗？",
   "options": [
    "必须，IgH 启动时从 /etc 读取 ESI",
    "不需要，IgH 读 SII，期望的厂商号和产品号由程序给出",
    "必须，否则无法进入 PREOP",
    "只有用 FoE 升级时才需要"
   ],
   "answer": 1,
   "explain": "IgH 不解析 ESI。它从 SII 读身份与默认配置，再与 <code>ecrt_master_slave_config()</code> 里的厂商号、产品号比较。ESI 对查 PDO 和对象字典仍然有参考价值。"
  },
  {
   "id": "u2-l4#4",
   "lesson": "u2-l4",
   "q": "SII 类别区里类型号 41 的类别是什么？",
   "options": [
    "Strings",
    "General",
    "SyncM",
    "RXPDO"
   ],
   "answer": 2,
   "explain": "10 Strings、30 General、40 FMMU、41 SyncM、50 TXPDO、51 RXPDO、60 DC。"
  },
  {
   "id": "u3-l0#1",
   "lesson": "u3-l0",
   "q": "对象 <code>0x6040</code>（控制字）属于索引空间的哪个分区？",
   "options": [
    "通信区 0x1000–0x1FFF",
    "厂商区 0x2000–0x5FFF",
    "设备行规区 0x6000–0x9FFF",
    "数据类型区 0x0000–0x0FFF"
   ],
   "answer": 2,
   "explain": "0x6000–0x9FFF 是设备行规区，CiA 402 驱动器的第一个轴占 0x6000–0x67FF，6040 就在其中。"
  },
  {
   "id": "u3-l0#2",
   "lesson": "u3-l0",
   "q": "RECORD 对象（如 <code>0x1018</code>、<code>0x1600</code>）的子索引 0 是什么？",
   "options": [
    "第一个数据成员",
    "最大子索引，即成员个数（UINT8）",
    "整个对象的数据类型编码",
    "对象的访问权限"
   ],
   "answer": 1,
   "explain": "ARRAY 和 RECORD 的子索引 0 都是 UINT8 的最大子索引，成员从 1 开始；PDO 映射对象里它就是已映射条目数。VAR 只有子索引 0，那才是值本身。"
  },
  {
   "id": "u3-l0#3",
   "lesson": "u3-l0",
   "q": "<code>0x6040</code> 已映射进 RxPDO，从站在 OP。此时用 SDO 把 6040 写成 0x0006，会怎样？",
   "options": [
    "永久生效，直到下次 SDO 写",
    "下一周期被主站过程数据覆盖（有的从站直接回 abort 拒绝）",
    "从站自动把 6040 从 PDO 映射里移除",
    "主站会把 SDO 值同步进过程映像"
   ],
   "answer": 1,
   "explain": "表里只有一个 6040，每周期 PDO 都把主站过程映像里的值写进去，SDO 写入只能活到下一周期。要改控制字就改过程映像里的值。"
  },
  {
   "id": "u3-l0#4",
   "lesson": "u3-l0",
   "q": "主站从哪里知道从站对象字典的结构？",
   "options": [
    "读 ESC 寄存器 0x0000–0x0FFF",
    "ESI 的 <code>&lt;Objects&gt;</code> 和从站在线提供的 SDO Info 服务，二者都应与固件对象表一致",
    "从 FMMU 配置反推",
    "从 WKC 的计数推断"
   ],
   "answer": 1,
   "explain": "ESC 寄存器是芯片的物理内存，不含对象字典。结构来自离线的 ESI 和在线的 SDO Info；真正实现了什么以固件（SDO Info）为准。"
  },
  {
   "id": "u3-l1#1",
   "lesson": "u3-l1",
   "q": "读到 <code>0x0130 = 0x0014</code>，从站处于什么情况？",
   "options": [
    "在 OP，一切正常",
    "在 SAFEOP，并有一个尚未确认的错误",
    "在 BOOT，正在升级固件",
    "在 PREOP，请求 SAFEOP 正在进行中"
   ],
   "answer": 1,
   "explain": "低 4 位 0x4 = SAFEOP，bit4（0x10）= 错误指示。原因码要去 0x0134 读，确认要写 0x0120 = 0x14。"
  },
  {
   "id": "u3-l1#2",
   "lesson": "u3-l1",
   "q": "从站在 INIT，主站直接写 <code>0x0120 = 0x04</code>，最可能的结果是？",
   "options": [
    "从站跳到 SAFEOP",
    "从站先自动经过 PREOP 再到 SAFEOP",
    "从站留在 INIT，置错误位并报 0x0011",
    "ESC 硬件复位"
   ],
   "answer": 2,
   "explain": "向上只能一级一级走。越级请求是无效状态转换，AL 状态码 0x0011，0x0130 读到 0x0011（INIT | 错误位）。"
  },
  {
   "id": "u3-l1#3",
   "lesson": "u3-l1",
   "q": "哪个状态是第一次可以用 SDO 读写对象字典的状态？",
   "options": [
    "INIT",
    "PREOP",
    "SAFEOP",
    "只有 OP"
   ],
   "answer": 1,
   "explain": "PREOP 打开邮箱通信，SDO 走邮箱。PDO 映射也正是在 PREOP 里用 SDO 写进去的，之后才能请求 SAFEOP。"
  },
  {
   "id": "u3-l1#4",
   "lesson": "u3-l1",
   "q": "运行中从站因看门狗掉到 SAFEOP 并置了错误位。主站确认错误应写什么？",
   "options": [
    "<code>0x0120 = 0x08</code>",
    "<code>0x0120 = 0x14</code>",
    "<code>0x0134 = 0x0000</code>",
    "<code>0x0130 = 0x04</code>"
   ],
   "answer": 1,
   "explain": "确认 = 当前状态值 | bit4，SAFEOP 下即 0x14。0x0130 和 0x0134 由从站写，主站不写。确认后再请求 0x08 才回 OP。"
  },
  {
   "id": "u3-l2#1",
   "lesson": "u3-l2",
   "q": "邮箱头第 5 字节是 <code>0x13</code>，它表示什么？",
   "options": [
    "长度 0x13 字节",
    "Type = 3（CoE），Cnt = 1",
    "SDO 应答",
    "通道 1，优先级 3"
   ],
   "answer": 1,
   "explain": "该字节低 4 位是 Type（3 = CoE），bit4–6 是计数器 Cnt。长度在字节 0–1，SDO 请求/应答由 CoE 头的 Service 区分。"
  },
  {
   "id": "u3-l2#2",
   "lesson": "u3-l2",
   "q": "用快速下载写 2 字节对象 6040，SDO 命令字节应是？",
   "options": [
    "<code>0x2F</code>",
    "<code>0x2B</code>",
    "<code>0x23</code>",
    "<code>0x40</code>"
   ],
   "answer": 1,
   "explain": "ccs = 1、e = 1、s = 1，n = 4 − 2 = 2：0b0010_1011 = 0x2B。0x2F 是 1 字节，0x23 是 4 字节，0x40 是上传请求。"
  },
  {
   "id": "u3-l2#3",
   "lesson": "u3-l2",
   "q": "在 OP 下 SDO 写 <code>0x1C12:00 = 0</code>，从站回 abort <code>0x08000022</code>。最合理的处理是？",
   "options": [
    "换一个子索引重试",
    "把 --type 改成 uint32",
    "先把从站退回 PREOP 再改 PDO 分配",
    "重启主站模块"
   ],
   "answer": 2,
   "explain": "0x08000022 = 当前设备状态下不能传输或存储。多数从站只允许在 PREOP 修改 PDO 分配与映射，下一课详细讲。"
  },
  {
   "id": "u3-l2#4",
   "lesson": "u3-l2",
   "q": "主站从 SM1 读到一帧邮箱：Type = 3，CoE 头小端为 <code>00 10</code>。这是什么？",
   "options": [
    "SDO 请求",
    "SDO 应答",
    "Emergency 报文",
    "SDO Information"
   ],
   "answer": 2,
   "explain": "Type 3 = CoE；CoE 头值 0x1000，高 4 位 Service = 1 即 Emergency。后面 8 字节是错误码（同 603F）、错误寄存器（同 1001）和厂商数据。SDO 请求是 2、应答是 3、SDO Info 是 8。"
  },
  {
   "id": "u3-l3#1",
   "lesson": "u3-l3",
   "q": "映射项 <code>0x60640020</code> 表示什么？",
   "options": [
    "6064:00，32 位",
    "6064:20，0 位",
    "0x0020 号对象的 6064 位",
    "6064:00，20 位"
   ],
   "answer": 0,
   "explain": "高 16 位 0x6064 是索引，中 8 位 0x00 是子索引，低 8 位 0x20 = 32 是位长。位长是十六进制，0x20 不是 20。"
  },
  {
   "id": "u3-l3#2",
   "lesson": "u3-l3",
   "q": "RxPDO 映射为 6040/16 + 607A/32 + 60B8/16，且 1C12 只分配了这一个 PDO，SM2 长度应是多少？",
   "options": [
    "6 字节",
    "8 字节",
    "64 字节",
    "3 字节"
   ],
   "answer": 1,
   "explain": "16 + 32 + 16 = 64 bit = 8 字节。SM 长度必须等于这个值，否则 PREOP→SAFEOP 报 0x001D（无效输出配置）。"
  },
  {
   "id": "u3-l3#3",
   "lesson": "u3-l3",
   "q": "动态修改 0x1600 的正确顺序是？",
   "options": [
    "直接改 1600:01，再请求 SAFEOP",
    "在 OP 下先写 1600:00 = 0，再写条目",
    "在 PREOP 下 1C12:00 = 0、1600:00 = 0、写条目、1600:00 = n、1C12 重新分配",
    "先请求 SAFEOP，再写 1C12"
   ],
   "answer": 2,
   "explain": "映射只在 PREOP 可改；先解除分配、清零个数，写完条目后写回个数触发校验，最后恢复分配。在 SAFEOP/OP 改通常回 0x08000022。"
  },
  {
   "id": "u3-l3#4",
   "lesson": "u3-l3",
   "q": "本课例子里应用先注册 6041、6064，再注册 6040、607A，控制字的域偏移会变成多少？",
   "options": [
    "仍是 0",
    "2",
    "6",
    "8"
   ],
   "answer": 2,
   "explain": "IgH 按首次注册到某个 SM 的顺序在域里排 SM：先注册输入则 SM3 的 6 字节在前，SM2 排在偏移 6。所以偏移要用注册回填的变量，不要手写常量。"
  },
  {
   "id": "u4-l1#1",
   "lesson": "u4-l1",
   "q": "主站怎样让所有从站同时锁存端口接收时间？",
   "options": [
    "逐台 FPRD 读 0x0910",
    "发一个写 <code>0x0900</code> 的广播（BWR），帧经过各端口时硬件锁存",
    "写 0x0120 进入 SAFEOP",
    "读 0x092C"
   ],
   "answer": 1,
   "explain": "对 0x0900 的写访问会让 ESC 锁存帧到达每个端口时的本地时间；用 BWR 一帧就让全部从站在同一帧上锁存。"
  },
  {
   "id": "u4-l1#2",
   "lesson": "u4-l1",
   "q": "从站 1 的端口环路时间是 1000 ns，从站 2 是 560 ns（简化模型，忽略转发时间）。两站之间单程延时约为？",
   "options": [
    "1560 ns",
    "440 ns",
    "220 ns",
    "780 ns"
   ],
   "answer": 2,
   "explain": "差值 440 ns 是从站 1 与从站 2 之间那段线的往返时间，单程取一半即 220 ns。"
  },
  {
   "id": "u4-l1#3",
   "lesson": "u4-l1",
   "q": "0x0920 系统时间偏移写好之后，为什么还要每周期读写 0x0910？",
   "options": [
    "因为 0x0920 每周期会被清零",
    "因为各 ESC 晶振频率略有差异，时间会慢慢漂开，需要持续漂移补偿",
    "为了触发端口时间锁存",
    "为了让从站进入 OP"
   ],
   "answer": 1,
   "explain": "偏移只对齐起点；晶振有 ppm 级误差，必须周期性把参考时钟的系统时间分发下去，由 ESC 内部控制环修正快慢。"
  },
  {
   "id": "u4-l1#4",
   "lesson": "u4-l1",
   "q": "让从站按 1 ms 产生 SYNC0，至少涉及哪组寄存器？",
   "options": [
    "<code>0x0990</code> 启动时间、<code>0x09A0</code> 周期、<code>0x0980/0x0981</code> 激活",
    "0x0928、0x092C",
    "0x0120、0x0130",
    "0x0800 起的 SM 寄存器"
   ],
   "answer": 0,
   "explain": "启动时间决定第一个脉冲的系统时间，周期寄存器决定间隔，周期单元激活位打开 SYNC0 输出；IgH 通过 ecrt_slave_config_dc 帮你写这些。"
  },
  {
   "id": "u4-l2#1",
   "lesson": "u4-l2",
   "q": "哪种同步模式会把主站发帧的抖动原样传给驱动器的控制周期？",
   "options": [
    "Free Run",
    "SM 同步",
    "DC 同步 SYNC0",
    "三种都不会"
   ],
   "answer": 1,
   "explain": "SM 同步由输出 SM 的写入事件（即帧到达）触发应用，帧早一点晚一点，应用周期就跟着早晚。DC 同步由 SYNC0 触发，与帧到达时刻解耦。"
  },
  {
   "id": "u4-l2#2",
   "lesson": "u4-l2",
   "q": "DC 同步模式下，一帧过程数据必须满足什么？",
   "options": [
    "在 SYNC0 之后到达",
    "在 SYNC0 之前到达最远的从站，并留有余量",
    "与 SYNC0 同时到达",
    "只要在同一个毫秒内到达"
   ],
   "answer": 1,
   "explain": "SYNC0 触发时从站取用最新输出；帧晚于 SYNC0 到达，这个周期用的就是旧数据，累计到阈值会报同步错误。"
  },
  {
   "id": "u4-l2#3",
   "lesson": "u4-l2",
   "q": "在 IgH 中，调节\"帧到达与 SYNC0 之间余量\"的主要参数是？",
   "options": [
    "<code>assign_activate</code>",
    "<code>sync0_shift</code>",
    "<code>sync1_cycle</code>",
    "0x0928"
   ],
   "answer": 1,
   "explain": "SYNC0 起点按主站应用时间的周期网格再加 sync0_shift 计算，shift 越大，SYNC0 相对主站发帧越靠后，余量越大（也意味着延迟更大）。"
  },
  {
   "id": "u4-l2#4",
   "lesson": "u4-l2",
   "q": "系统负载高时从站间歇性报 AL <code>0x001A</code>，最先该查什么？",
   "options": [
    "ESI 里的厂商号",
    "主站周期线程的唤醒延迟（如 cyclictest）与安全余量",
    "SII EEPROM 内容",
    "网线长度是否超过 100 m"
   ],
   "answer": 1,
   "explain": "0x001A 是同步错误。负载相关的间歇错误最常见的原因是主站唤醒抖动吃掉了余量，使帧晚于 SYNC0 到达。"
  },
  {
   "id": "u5-l1#1",
   "lesson": "u5-l1",
   "q": "读到 6041 = <code>0x0237</code>，驱动器处于哪个状态？",
   "options": [
    "Switched on 已接通",
    "Operation enabled 运行使能",
    "Quick stop active 快速停止",
    "Fault 故障"
   ],
   "answer": 1,
   "explain": "<code>0x0237 &amp; 0x006F = 0x0027</code>，正好是 Operation enabled 的判定值；bit9 Remote 与 bit4 电压位被掩码去掉。"
  },
  {
   "id": "u5-l1#2",
   "lesson": "u5-l1",
   "q": "读到 6041 = <code>0x0217</code>，与 <code>0x0237</code> 只差 bit5。它是什么状态？",
   "options": [
    "Operation enabled 运行使能",
    "Quick stop active 快速停止",
    "Fault reaction active 故障反应",
    "Switch on disabled 禁止接通"
   ],
   "answer": 1,
   "explain": "bit5 Quick stop 低有效：<code>0x0217 &amp; 0x006F = 0x0007</code>，是 Quick stop active，驱动器正在按 605A 停车。"
  },
  {
   "id": "u5-l1#3",
   "lesson": "u5-l1",
   "q": "6041 的 bit9 Remote = 0 意味着什么？",
   "options": [
    "驱动器有故障",
    "控制字不被执行，驱动器处于本地控制",
    "母线没有电压",
    "驱动器不支持 CSP"
   ],
   "answer": 1,
   "explain": "bit9 = 1 表示控制字由总线控制并被执行；为 0 时（例如调试软件接管）主站写 6040 不起作用。母线电压看的是 bit4。"
  },
  {
   "id": "u5-l1#4",
   "lesson": "u5-l1",
   "q": "驱动器在 Switch on disabled，主站直接写 6040 = <code>0x000F</code>，按标准会发生什么？",
   "options": [
    "依次走 2、3、4 到运行使能",
    "停在禁止接通，因为该状态只接受 Shutdown",
    "进入故障",
    "进入快速停止"
   ],
   "answer": 1,
   "explain": "禁止接通唯一的出口是转换 2，命令是 Shutdown（bit0 = 0，bit1、bit2 = 1）。<code>0x000F</code> 的 bit0 = 1，不匹配，所以状态不变。必须先写 <code>0x0006</code>。"
  },
  {
   "id": "u5-l2#1",
   "lesson": "u5-l2",
   "q": "要让驱动器进入周期同步位置模式，6060 应写多少？",
   "options": [
    "1",
    "6",
    "8",
    "9"
   ],
   "answer": 2,
   "explain": "CSP = 8。1 是 PP，6 是 HM，9 是 CSV。"
  },
  {
   "id": "u5-l2#2",
   "lesson": "u5-l2",
   "q": "CSV 模式下，如果应用要求精确定位，位置环由谁闭？",
   "options": [
    "驱动器",
    "主站",
    "不需要位置环",
    "ESC 硬件"
   ],
   "answer": 1,
   "explain": "CSV 下驱动器只闭速度环和转矩环；主站每周期读 6064，自己算位置误差并给出 <code>60FF</code>。"
  },
  {
   "id": "u5-l2#3",
   "lesson": "u5-l2",
   "q": "主站写完 6060 = 8，立刻在下一周期按 CSP 写 607A。最可能的问题是什么？",
   "options": [
    "607A 会被驱动器拒绝写入",
    "6061 可能还没变成 8，驱动器仍按旧模式执行",
    "ESM 会退回 SAFEOP",
    "6502 会被清零"
   ],
   "answer": 1,
   "explain": "6060 只是请求，6061 才是生效模式。正确做法是等 6061 = 8 后再按 CSP 发目标。"
  },
  {
   "id": "u5-l2#4",
   "lesson": "u5-l2",
   "q": "读到 6502 = <code>0x000000A1</code>，这台驱动器支持哪些模式？",
   "options": [
    "PP、HM、CSP",
    "PP、PV、CSP",
    "PP、HM、CSV",
    "VL、HM、CSP"
   ],
   "answer": 0,
   "explain": "<code>0xA1</code> = bit0 + bit5 + bit7，对应 PP、HM、CSP。"
  },
  {
   "id": "u5-l3#1",
   "lesson": "u5-l3",
   "q": "605A = 6，驱动器在运行使能时收到 6040 = <code>0x0002</code>，结果是？",
   "options": [
    "按快停斜坡停车后自动回到禁止接通",
    "按快停斜坡停车后停留在快速停止，功率级继续出力",
    "立即关断，电机自由停转",
    "进入故障"
   ],
   "answer": 1,
   "explain": "605A 的 5–8 与 1–4 停车方式相同，区别是停完留在 Quick stop active。6 = 快停斜坡 + 停留。"
  },
  {
   "id": "u5-l3#2",
   "lesson": "u5-l3",
   "q": "驱动器在故障状态，主站每个周期都写 6040 = <code>0x0080</code>，却一直不复位（原因已排除）。最可能的原因是？",
   "options": [
    "605E 设成了 0",
    "必须先写 <code>0x0006</code>",
    "bit7 一直是 1，没有 0 → 1 的上升沿",
    "603F 需要先写 0"
   ],
   "answer": 2,
   "explain": "Fault reset 只认 bit7 的上升沿。原因排除前那次边沿已被消耗，要先写回 bit7 = 0 至少一个周期，再写 <code>0x0080</code>。"
  },
  {
   "id": "u5-l3#3",
   "lesson": "u5-l3",
   "q": "垂直轴停车时，正确的顺序是？",
   "options": [
    "先关功率级，再抱闸",
    "先抱闸，等抱闸延时后再关功率级",
    "抱闸与关功率级同时进行",
    "只要 605A = 0 就不需要抱闸"
   ],
   "answer": 1,
   "explain": "抱闸机械压紧需要时间，这段时间里必须靠电机出力扶住负载，否则负载会下坠。"
  },
  {
   "id": "u5-l3#4",
   "lesson": "u5-l3",
   "q": "603F = <code>0x2310</code> 属于哪一大类故障？",
   "options": [
    "电流",
    "电压",
    "温度",
    "通信"
   ],
   "answer": 0,
   "explain": "第一位十六进制数 2 表示电流类，<code>0x2310</code> 是持续过流；3 是电压、4 是温度。"
  },
  {
   "id": "u5-l4#1",
   "lesson": "u5-l4",
   "q": "20 位编码器（608F:01 = 1048576、:02 = 1），6091 = 10:1，6092 = 360000:1，用户单位 0.001°。1 个用户单位约等于多少编码器增量？",
   "options": [
    "2.91",
    "29.13",
    "291.3",
    "0.034"
   ],
   "answer": 1,
   "explain": "增量 = 1 × 1048576 × 10 ÷ 360000 ≈ 29.13。输出轴一圈 = 电机 10 圈 = 10 485 760 增量 = 360 000 个用户单位。"
  },
  {
   "id": "u5-l4#2",
   "lesson": "u5-l4",
   "q": "为什么软件限位 607D 要设在硬限位开关之内？",
   "options": [
    "硬限位开关只在回零时有效",
    "让驱动器在正常指令下提前停住，并留出减速距离；硬限位是最后一道防线，碰到通常要停车报错",
    "607D 的单位比硬限位更精确",
    "标准规定 607D 必须小于 60FD"
   ],
   "answer": 1,
   "explain": "软件限位裁剪指令、不必停机；硬限位触发多半导致停车或报故障，并且轴要有足够距离减速，否则会冲到机械挡块。"
  },
  {
   "id": "u5-l4#3",
   "lesson": "u5-l4",
   "q": "回零模式下，哪一组 6041 位表示回零成功完成？",
   "options": [
    "bit10 = 1 即可",
    "bit12 = 1 且 bit13 = 0（通常 bit10 也为 1）",
    "bit11 = 1",
    "60FD bit2 = 1"
   ],
   "answer": 1,
   "explain": "HM 模式下 bit12 Homing attained、bit13 Homing error；bit12 = 1、bit13 = 0 才是成功。单看 bit10 分不清完成和被中断。"
  },
  {
   "id": "u5-l4#4",
   "lesson": "u5-l4",
   "q": "60B8 = <code>0x0011</code>，探针 1 输入出现正沿后，锁存位置在哪个对象？",
   "options": [
    "60BA",
    "60BB",
    "60BC",
    "6064"
   ],
   "answer": 0,
   "explain": "<code>0x0011</code> = bit0 使能探针 1 + bit4 正沿锁存。探针 1 正沿 → 60BA，负沿 → 60BB；探针 2 用 60BC/60BD。"
  },
  {
   "id": "u6-l1#1",
   "lesson": "u6-l1",
   "q": "程序已调用 <code>ecrt_master_activate</code>，此时想再加一个 PDO 条目，应该怎么做？",
   "options": [
    "直接再调一次 <code>ecrt_domain_reg_pdo_entry_list</code>",
    "用 <code>ecrt_master_deactivate</code> 或释放主站后重新配置，再 activate",
    "在周期里用 <code>EC_WRITE</code> 写 0x1600 即可"
   ],
   "answer": 1,
   "explain": "activate 冻结配置并计算域布局，之后配置类调用不再生效。要改配置只能 deactivate 或释放主站后从头来过。"
  },
  {
   "id": "u6-l1#2",
   "lesson": "u6-l1",
   "q": "周期任务里 <code>ecrt_domain_process</code> 应该放在哪里？",
   "options": [
    "<code>ecrt_master_send</code> 之后",
    "<code>ecrt_master_receive</code> 之后、读过程数据之前",
    "<code>ecrt_domain_queue</code> 之后"
   ],
   "answer": 1,
   "explain": "receive 取回帧，process 把数据拷进域内存并统计 WKC，之后读到的输入才是本周期的新值。"
  },
  {
   "id": "u6-l1#3",
   "lesson": "u6-l1",
   "q": "<code>ecrt_master_sync_reference_clock</code> 和 <code>ecrt_master_sync_slave_clocks</code> 通常放在哪？",
   "options": [
    "配置期，activate 之前各调一次",
    "每周期 domain_queue 之后、send 之前，前面先调 application_time",
    "每周期 receive 之前"
   ],
   "answer": 1,
   "explain": "它们只是把 DC 数据报排进发送队列，要在 send 之前调用才会随本周期的帧一起发出；application_time 先提供本周期的时间基准。"
  },
  {
   "id": "u6-l1#4",
   "lesson": "u6-l1",
   "q": "单从站 CSP，<code>ethercat domains</code> 显示 WorkingCounter 0/3，最可能是什么情况？",
   "options": [
    "从站在 OP，一切正常",
    "从站没进 SAFEOP/OP 或链路断开，过程数据没被交换",
    "PDO 映射多了一项"
   ],
   "answer": 1,
   "explain": "期望 3 表示这台从站的读和写都应命中。实际为 0 说明没有从站处理这段逻辑地址，典型原因是从站不在 SAFEOP/OP 或链路断开，此时 wc_state 为 EC_WC_ZERO。"
  },
  {
   "id": "u6-l2#1",
   "lesson": "u6-l2",
   "q": "主站请求 PREOP→SAFEOP 时，SSC 会调用哪个应用回调？",
   "options": [
    "<code>APPL_StartMailboxHandler</code>",
    "<code>APPL_StartInputHandler</code>",
    "<code>APPL_StartOutputHandler</code>"
   ],
   "answer": 1,
   "explain": "SAFEOP 的含义是输入有效、输出忽略，所以进 SAFEOP 时启动的是输入处理；输出处理在 SAFEOP→OP 时启动。"
  },
  {
   "id": "u6-l2#2",
   "lesson": "u6-l2",
   "q": "SDO 请求（比如读 6041）在 SSC 里通常由哪个上下文处理？",
   "options": [
    "Sync0_Isr",
    "PDI_Isr",
    "MainLoop"
   ],
   "answer": 2,
   "explain": "邮箱不紧急，放在主循环里处理；中断只做过程数据这类周期性、有时限的工作。"
  },
  {
   "id": "u6-l2#3",
   "lesson": "u6-l2",
   "q": "APPL_StartOutputHandler 返回了一个非零 AL 状态码，主站会看到什么？",
   "options": [
    "从站照样进 OP",
    "从站留在 SAFEOP，0x0130 错误位置 1，0x0134 为该码",
    "从站回到 INIT 且无错误码"
   ],
   "answer": 1,
   "explain": "回调返回非零表示拒绝转换，协议层把码写进 0x0134 并置错误指示位，状态停在原状态 SAFEOP。"
  },
  {
   "id": "u6-l2#4",
   "lesson": "u6-l2",
   "q": "主站程序崩溃，不再发周期帧。几十到几百毫秒后从站的 AL 状态最可能是？",
   "options": [
    "0x0130 = 0x0008，0x0134 = 0x0000",
    "0x0130 = 0x0014，0x0134 = 0x001B",
    "0x0130 = 0x0001，0x0134 = 0x0011"
   ],
   "answer": 1,
   "explain": "输出 SM 不再被写，看门狗到期，协议层把从站退回 SAFEOP（0x04）并置错误位（0x10），状态码 0x001B 表示 Sync Manager 看门狗。"
  },
  {
   "id": "u6-l3#1",
   "lesson": "u6-l3",
   "q": "CSP 模式下，驱动器内部哪几个环由驱动器自己闭合？",
   "options": [
    "只有电流环",
    "速度环和电流环，位置环在主站",
    "位置环、速度环、电流环都在驱动器"
   ],
   "answer": 2,
   "explain": "CSP 下主站每周期给目标位置 607A，驱动器闭合位置、速度、电流三环；主站负责的是规划和插补，不是位置闭环。"
  },
  {
   "id": "u6-l3#2",
   "lesson": "u6-l3",
   "q": "为什么电流环周期（如 62.5 µs）远短于总线周期（如 1 ms）？",
   "options": [
    "因为总线会在 1 ms 内发 16 帧",
    "内环要比外环快得多，外环才能把它当作即时执行器；电流环在驱动器本地运行，不依赖总线",
    "因为 FOC 必须与 SYNC0 同频"
   ],
   "answer": 1,
   "explain": "级联控制要求内环带宽远高于外环。电流环只用本地的相电流采样和编码器角度，与总线周期无关。"
  },
  {
   "id": "u6-l3#3",
   "lesson": "u6-l3",
   "q": "20 位编码器、6091/6092 为 1:1、周期 1 ms，主站在一个周期里把 607A 从 0 改成 5 000 000，最可能发生什么？",
   "options": [
    "电机在 1 ms 内走到位",
    "60F4 瞬间巨大，超过 6065 并持续 6066 后置 6041 bit13，多数驱动器随即报故障",
    "驱动器自动把它规划成梯形曲线"
   ],
   "answer": 1,
   "explain": "5 000 000 counts 约 4.8 圈，1 ms 内走完需要约 286 000 rpm，不可达。CSP 下驱动器不做轨迹规划，于是跟随误差爆表。"
  },
  {
   "id": "u6-l3#4",
   "lesson": "u6-l3",
   "q": "6065 的值为 10000，它的单位是什么？",
   "options": [
    "毫秒",
    "位置单位：用户单位，默认常为编码器 counts，经 6091/6092 换算",
    "0.1 rpm"
   ],
   "answer": 1,
   "explain": "6065 与 607A、6064 同为位置单位。若 6091/6092 不是 1:1，它就不再等于编码器 counts，以厂商手册为准。时间是 6066（ms）。"
  },
  {
   "id": "u7-l0#1",
   "lesson": "u7-l0",
   "q": "IgH 空闲时要发现总线上有几台从站，需要几帧？",
   "options": [
    "每台从站 1 帧 APRD",
    "1 帧 <code>BRD 0x0130</code>，WKC 就是在线从站数",
    "读完每台的 SII 才能知道",
    "每台一次 SDO 往返"
   ],
   "answer": 1,
   "explain": "广播读经过每台从站时 WKC 各加 1，回到主站的 WKC 就是在线从站数。空闲期每个周期都发这一帧，所以热插拔也能被发现。"
  },
  {
   "id": "u7-l0#2",
   "lesson": "u7-l0",
   "q": "为什么 IgH 扫描一台驱动器要秒级时间？",
   "options": [
    "网线太长，传播延时大",
    "从站固件处理寄存器读很慢",
    "SII 每次只读 2 个字、每次至少 2 个数据报，且空闲期每周期只推进一步；1200 字（示例）在 HZ = 1000 时就要 1.2 s 以上",
    "IgH 要先等动力电上电"
   ],
   "answer": 2,
   "explain": "耗时 ≈ 数据报数 × 发送周期。读 SII 与后台拉对象字典是往返次数最多的两项，都要上千个数据报。"
  },
  {
   "id": "u7-l0#3",
   "lesson": "u7-l0",
   "q": "主站写 6040 = <code>0x0007</code> 之前，驱动器侧必须满足什么？",
   "options": [
    "6041 bit4 = 1，主电压已到位",
    "电机已经在转",
    "抱闸已经松开",
    "从站刚刚重读过 SII"
   ],
   "answer": 0,
   "explain": "0x0007 让功率级就绪，需要母线电压（bit4 Voltage Enabled）。动力电可以晚于总线 OP 上电，但必须早于这一步；抱闸是在 0x000F 之后才松的。"
  },
  {
   "id": "u7-l0#4",
   "lesson": "u7-l0",
   "q": "<code>ethercat master</code> 的 Tx frames 两次读数之差代表什么？",
   "options": [
    "两次读数之间发出的数据报数",
    "两次读数之间主站发出的以太网帧数，一帧可装多个数据报",
    "从站回送的错误帧数",
    "SII 的字数"
   ],
   "answer": 1,
   "explain": "计数器数的是帧。空闲期每周期 1 帧、每台从站每周期推进一步，所以单台扫描时帧数≈步数≈数据报数；多等的时间也会以约 HZ 帧/秒计入。"
  },
  {
   "id": "u7-l1#1",
   "lesson": "u7-l1",
   "q": "从站固件卡死在一个死循环里，下面哪条命令最可能仍然给出正常读数？",
   "options": [
    "<code>ethercat upload -p0 0x6041 0</code>",
    "<code>ethercat reg_read -p0 0x0130 2</code>",
    "<code>ethercat sdos -p0</code>",
    "<code>ethercat download -p0 0x6060 0 8</code>"
   ],
   "answer": 1,
   "explain": "寄存器读由 ESC 硬件在帧经过时应答，不需要固件；upload、sdos、download 都走邮箱，要固件处理，固件卡死会超时。"
  },
  {
   "id": "u7-l1#2",
   "lesson": "u7-l1",
   "q": "<code>ethercat domains</code> 显示 <code>WorkingCounter 5/6</code>，两台从站各有输出和输入。最先怀疑什么？",
   "options": [
    "某台从站的输入那一段没被处理（少了 +1）",
    "主站 CPU 太快",
    "SDO 配置失败导致对象字典为空",
    "Wireshark 过滤器写错"
   ],
   "answer": 0,
   "explain": "IgH 的期望 WKC 按每台输出 +2、输入 +1 累加，2 台共 6；少 1 正好是一个输入段没被计数。下一步看 slaves 和 domains -v 找是哪一台。"
  },
  {
   "id": "u7-l1#3",
   "lesson": "u7-l1",
   "q": "想在 Wireshark 里只看周期过程数据的 LRW 数据报，最合适的过滤器是？",
   "options": [
    "<code>tcp.port == 88a4</code>",
    "<code>ecat.cmd == 12</code>",
    "<code>ecat.cnt == 12</code>",
    "<code>ip.proto == 0x88a4</code>"
   ],
   "answer": 1,
   "explain": "LRW 的命令码是 12，ecat.cmd 是数据报命令字段。EtherCAT 不走 IP/TCP，ecat.cnt 是 WKC。"
  },
  {
   "id": "u7-l1#4",
   "lesson": "u7-l1",
   "q": "IgH 用原生网卡驱动（如 ec_e1000e）时，在主站本机对该网卡用 Wireshark 抓不到 EtherCAT 帧，最合理的解释是？",
   "options": [
    "EtherCAT 帧是加密的",
    "原生驱动把网卡从 Linux 网络协议栈接管，抓包点看不到这些帧",
    "Wireshark 不支持 0x88A4",
    "从站把帧吞掉了"
   ],
   "answer": 1,
   "explain": "原生驱动绕过内核网络栈直接收发，抓包工具挂不上；可改用 generic 驱动，或用交换机镜像口、TAP 在线上抓。"
  },
  {
   "id": "u7-l2#1",
   "lesson": "u7-l2",
   "q": "电机不动。<code>ethercat slaves</code> 显示一台从站 SAFEOP + E。下一步最该读什么？",
   "options": [
    "6041",
    "<code>0x0134</code> AL Status Code",
    "6064 实际位置",
    "Wireshark 里 LRW 的数据"
   ],
   "answer": 1,
   "explain": "总线状态机没到 OP，先在 ESM 这一层找原因：0x0134 给出拒绝或退出的原因码。此时 6041 和过程数据都可能是过期的。"
  },
  {
   "id": "u7-l2#2",
   "lesson": "u7-l2",
   "q": "6041 = 0x0668。按 CiA402 掩码判定，下面哪个结论正确？",
   "options": [
    "&amp; 0x006F = 0x0027，Operation Enabled",
    "&amp; 0x004F = 0x0040，Switch On Disabled",
    "两种掩码都匹配不上标准状态，但 bit3 Fault = 1，应按故障处理并读 603F",
    "&amp; 0x006F = 0x0028，Fault"
   ],
   "answer": 2,
   "explain": "0x0668 &amp; 0x004F = 0x0048，&amp; 0x006F = 0x0068，都不在状态表里；bit3 = 1 是故障位，先读 603F 再用 6040 bit7 上升沿复位。"
  },
  {
   "id": "u7-l2#3",
   "lesson": "u7-l2",
   "q": "OP 下 <code>ethercat download</code> 改 0x1C12 返回 abort 0x08000022，最合理的做法是？",
   "options": [
    "反复重试直到成功",
    "在 PREOP 由 <code>ecrt_slave_config_pdos</code> 配置映射，让主站在进入 SAFEOP 前下发",
    "改用 <code>reg_write</code> 直接写 SM2",
    "把看门狗时间加大"
   ],
   "answer": 1,
   "explain": "0x08000022 表示当前设备状态不允许这次写入；PDO 分配与映射只能在 PREOP 改，IgH 在 PREOP→SAFEOP 之间按配置下发。"
  },
  {
   "id": "u7-l2#4",
   "lesson": "u7-l2",
   "q": "程序 Ctrl+C 后从站显示 SAFEOP + E，<code>0x0134</code> = 0x001B。这说明什么？",
   "options": [
    "从站硬件损坏",
    "网线断了",
    "周期帧停止后输出 SM 看门狗到期，从站按设计退到 SAFEOP 并把输出置安全值",
    "DC 参考时钟丢失"
   ],
   "answer": 2,
   "explain": "0x001B 是同步管理器看门狗超时。这是保护动作；正确做法是有序退出：先让驱动器断使能，再释放主站。"
  }
 ]
};
