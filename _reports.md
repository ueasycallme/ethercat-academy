# Agent 汇报汇总（执行 session 整理）

## D — u0-l1(8 步) u4-l1(8 步) u4-l2(7 步)：_check OK
契约缺陷：.is-hot 作用于 <g> 不加粗子 rect（已修：site.css 增加 g.is-hot > 图形 规则）；步进器未暴露（已修：Academy.steppers）；fx.move 无分段路径（未改，D 用嵌套 g + transition-delay 解决）。
对附录 A 的异议：
1. u4-l1 "周期 ARMW 0x0910" → IgH 实际用 FRMW（读参考时钟站地址，写其余从站）；页面动画写 FRMW，正文写 ARMW/FRMW。
2. "主站时钟锁到参考从站"只是一种做法；IgH ecrt_master_sync_reference_clock 默认方向是把应用时间写给参考时钟。页面两种都讲。
3. u4-l2 "ethercat 域 WKC 波动统计" CLI 无此功能 → 改为应用中打印 ecrt_domain_state 的 working_counter。
待抽查：
- u0-l1 机制·两条通路：SM0–3 用途写"常见惯例，以 ESI/SII 为准"。
- u0-l1 真机：ethercat master 的 Phase 取值、slaves 输出列（状态、+/E）凭记忆（IgH 1.5）。
- u4-l1 机制·寄存器表：0x0990 宽度"32/64 位因芯片而异"；0x09A4 描述为"SYNC1 相对 SYNC0 的偏移"需按 ET1100 手册核对；0x0930 仅概括无位定义。
- u4-l1 机制·延时测量：简化模型（环路差/2、末端 0、忽略转发时间），示例数值 1000/560/220/500 ns 为编造示例并已标注。
- u4-l1 动画第 7 步："各站偏差通常远小于 1 µs"定性说法。
- u4-l1 真机：ethercat slaves -v 字段名（Distributed clocks / DC system time transmission delay / RxTime/Diff）凭记忆；0x092C "几十 ns 内"标因芯片/拓扑而异。
- u4-l2 机制·模式表：1C32:01 其余取值"以 ETG.1020 为准"；子索引表 1C32:03 Shift Time 语义"以 ETG.1020 为准"，0x0B/0x0C/0x20 名称凭记忆（页面注"驱动器不一定实现"）。
- u4-l2 机制·代码：assign_activate 0x0300 "因厂商而异"；sync0_shift 400000 示例值；TIMESPEC2NS 是 IgH 示例宏非 API。
- u4-l2 机制·抖动表：IgH 原生驱动举 igb、e1000e，因版本而异。
- u4-l2 主从对照：同步错误阈值"因厂商而异"。误区："未激活 SYNC0 时很多驱动器拒绝进 SAFEOP/OP"经验性说法。
- u4-l2 真机：cyclictest "PREEMPT_RT 常见几十 µs"；AL 码 0x001A/0x002C/0x0030 需按 ETG.1000.6 抽查。
未实现：无。未解决：深色主题未目检。

## G — u7-l1(7 步) u7-l2(7 步) glossary(158 条)：_check OK
契约缺陷：.is-hot 作用于 <g> 不明显（已修）；glossary 借用 .lesson-head/.lesson-lede/.lesson-block 类，显示正常。
对附录 A 的异议：
1. u7-l2 案例"6041=0x0668"：0x0668&0x006F=0x0068，&0x004F=0x0048，不匹配任何标准状态（bit3 Fault 与 bit6 SOD 同时为 1）。页面写为"判不出标准状态 → 按 bit3 当故障处理、读 603F、bit7 上升沿复位"；测验把"0x0028→Fault"作为错误选项。
2. AL 0x0011 按 ETG.1000.6 是 "Invalid requested state change"，非"无效配置"（已转告 C）。
待抽查：
- u7-l1 机制·CLI 表：示例输出标"示意"，字段"以 --help 为准"；config 输出未给确切版式。
- u7-l1 机制·Wireshark：ecat.cmd/ecat.ado/ecat.adp/ecat.cnt 注"版本可能有出入"；IgH 原生驱动下本机抓包"通常看不到"帧。
- u7-l1 主从/误区：reg_read/upload/states 在应用运行中可用、slaves 显示主站缓存值（基于对 IgH 行为的理解）。
- u7-l1 真机：示例 PDO 物理地址 0x1100、upload 输出 "0x0237 567" 为示意。
- u7-l2 案例1：拒绝映射 AL 码 0x001D/0x001E/0x0024/0x0025 需按 ETG.1000.6 核对。
- u7-l2 案例2："ESC 复位默认看门狗约 100 ms（0x0400=2498、0x0420=1000）"；"周期恢复后 IgH 自动确认错误并重新请求 OP"。
- u7-l2 案例3："从站不在 SAFEOP/OP 时 ESC 不为该段加 WKC"；SAFEOP 下输出段是否计数未展开。
- u7-l2 案例4：0x0668 属"厂商实现偏差或过渡时刻读数"为推断。
- u7-l2 案例5：OP 下拒改参数"因厂商而异"。案例8：1C32 错误计数子索引"因厂商而异"未写号。
- u7-l2 案例9：AL 0x002C/0x0030 作为 DC 相关码；assign-activate "常见 0x0300，以 ESI 为准"。
- u7-l2 案例10：插反端口表现"因拓扑而异"。案例11：IgH dmesg 报错"措辞随版本"。案例12："程序释放主站后 IgH 一般把从站请求回 PREOP"。
- glossary：页尾注"部分寄存器因芯片而异"；SYNC1 用法"因厂商而异"；0x60FD 位定义部分厂商扩展；首次出现课按课程矩阵推断（6040/6041/607A/6064→u0-l1；0x0300/0x0310→u7-l1）。
未实现：无。未解决：深浅主题、手机宽度未目检。

## C — u3-l1(11 步+初始) u3-l2(9 步+初始) u3-l3(8 步+初始)：_check OK；headless Chrome 自测，浅/深主题截图可读，375px 无横向滚动
契约缺陷：无（同样建议 hot 作用于有描边的元素，已在 site.css 修）。页内互动：u3-l1 0x0130 逐位解码器；u3-l3 映射项拆解器。
对附录 A 的异议：
1. u3-l1 AL 0x0011 = "请求的状态转换无效"，页面按规范写（例：INIT 直接请求 SAFEOP）。
2. u3-l1 附录 A 写 9 步，但按"一步一件事"拆开是 11 步，超出第 4 节 5–9 步上限 → 设计方已裁定接受（第 4 节改为状态机、协议序列类课可到 12 步，含初始画面）。
3. u3-l2 "大于 4 字节走分段"不准确：普通传输（0x21/0x41）数据直接跟在总长度后，只有超过邮箱容量才用分段；页面按此讲并列为误区。
4. u3-l3 "C 结构体偏移 0、2、6、8"只对 packed 结构或域偏移成立，普通结构体会补齐为 0、4、8、12；页面写域偏移并提醒用 EC_READ_*/EC_WRITE_*。
待抽查：
- u3-l1 机制：AL Control/Status bit5（Device Identification）按 ET1100 手册写，未逐字核 ETG.1000.6。
- u3-l1 机制·AL 码表：另加 0x0012/0x0016/0x0017/0x0019/0x001D/0x0025/0x0030；0x002D 写"No Sync Error：未收到同步信号"需对照 ETG.1000.6。
- u3-l1 主从："无 µC 从站由 ESC 直接把请求照抄到 0x0130"（device emulation 概括，未写寄存器位）。
- u3-l1 真机：ethercat slaves 列序、reg_read -t uint16 语法、dmesg "AL status" 措辞凭 IgH 1.5 记忆。
- u3-l2 动画/机制：邮箱头 Address 填 0x0000（注"因实现而异"）；Cnt 示例写 1，IgH 可能填 0 未核。SDO 命令字节 bit4 作 Complete Access。
- u3-l2 真机：6041 示例 0x0250；upload 0x6041 5 的 abort "多数 0x06090011，因厂商而异"；Wireshark 过滤器 ecat_mailbox.coe "以版本为准"。
- u3-l3 真机：pdos 示例里 SM 物理地址/控制字节/PDO 名称"因厂商而异"；cstruct EC_WD_ENABLE/DISABLE 来自 SII"因从站而异"；domains -v 只给命令无示例输出。
- u3-l3 机制/Q4："IgH 按首次注册到某 SM 的顺序在域里排 SM"凭源码记忆。"固定映射从站连分配也不能改"写"以 ESI 为准"。
未实现：无。

## A — u1-l1(0–6) u1-l2(0–8) u1-l3(0–8)：_check OK；390px iframe 全步点过无警告；headless 截图版面无重叠
契约缺陷：无阻塞。箭头 marker 需每页 <defs> 自定义（SVG marker 无法经 CSS 共享，保持现状）。
对附录 A 的异议：
1. u1-l2 "最大 1498 字节数据"：1498 B 是整个数据报区上限，单个数据报数据最多 1486 B；页面两个数都写。
2. u1-l3 ARMW/FRMW WKC：被寻址那台读成功 +1，其余每台写成功 +1（凭记忆 ESC 手册 WKC 表，请抽查）。
待抽查：
- u1-l1 机制：DL Control 0x0101 回环两位取值（00 Auto、01 Auto close、10 Always open、11 Always closed）及 Auto close "恢复后需主站再写才打开"。
- u1-l1 真机：reg_read 无类型按字节低地址在前、--type uint16 给 16 位（注"随版本略有差别"）；未接端口回环位"因芯片配置而异"，bit1/bit2 只列名；解码器默认 0x0A31 为示例；`ethercat graph` 写"IgH 1.5 起"。
- u1-l1：冗余环一句带过；一圈"几十微秒"无具体数；进线插反导致处理顺序错乱为定性描述。
- u1-l2 真机：原生驱动抓包依赖 --enable-debug-if（"以安装版本为准"）；ESC 转发时把源 MAC 首字节 bit1 置 1（00:→02:）凭记忆。
- u1-l2 机制：CRC 错帧计入端口错误计数器（未写地址）；IRQ 字段"按位或、主站很少用"；Wireshark 只写 ecat 与 eth.type == 0x88a4。
- u1-l3 主从：IgH 空闲时周期 BRD 读 0x0130（WKC=在线从站数、数据=AL 状态按位或）；wc_state 取值 ZERO/INCOMPLETE/COMPLETE。
- u1-l3 机制：站别名 0x0012 需启用后才参与匹配；ARMW/FRMW 用于分发参考时钟。
- u1-l3 真机："IgH 用 FPRD 读寄存器"；站地址 0x1001–0x1003 为示例；dmesg "working counter" 日志。
未实现：无。未解决：深色主题未逐页看。

## F — u6-l1(9 步+初始) u6-l2(8 步+初始) u6-l3(8 步+初始)：_check OK；逐步点过无报错，回到第 0 步与初始一致
更新：已按裁定拆分，新步数 u6-l1 12 步、u6-l2 10 步、u6-l3 9 步（均含初始）；375px 复测无横向滚动。新增契约缺陷：行内 code nowrap 撑宽测验选项（已修 site.css：行内 code 允许 overflow-wrap:anywhere，.q-opt 列改 minmax(0,1fr)）。
（已按设计方裁定要求 F 拆分多改动步骤：u6-l1 第 9 步、u6-l2 第 7 步，见下方更新）
契约缺陷：无；建议 fx 加"按行号移动代码高亮条"助手（F 在页内自写，未改 site.js）。
对附录 A 的异议：
1. u6-l2 步序"PDI 中断收输出 → SYNC0 → 请求 SAFEOP"与实际不符（SAFEOP 前无过程数据、输出到 OP 才生效）→ 改为 MainLoop 邮箱 → 请求 SAFEOP 触发 APPL_StartInputHandler → SYNC0 中断 → 进 OP 后 PDI 中断收输出 → 看门狗到期。
2. u6-l3 "6065 单位是编码器 counts"不严谨 → 位置单位（用户单位，默认常为 counts，经 6091/6092 换算，以厂商为准）。
3. u6-l3 附录列 10 项压到 8 步：Clarke/Park 并入电流环；PWM+电机一步；编码器+反馈一步。
4. u6-l1：IgH 在 activate 前的空闲阶段已把从站带到 PREOP（初始画面按此画）；ecrt_domain_reg_pdo_entry_list 登记时即写回偏移，域内存在 activate 时分配。
待抽查：
- u6-l1 AssignActivate 0x0300 "常见值，以 ESI 为准"；activate 前调 ecrt_master_application_time 是否必需未确定（写法安全）。
- u6-l1 真机：VENDOR_ID/PRODUCT_CODE 用 0 占位；示例仅用桩头文件做 gcc 语法检查，未真机编译运行；domains 期望 Size 12、WKC 3/3，slaves "0 0:0 OP +" 按 IgH 1.5 回忆。
- u6-l1 机制：原生网卡驱动 ec_e1000e、ec_r8169 "以版本为准"。
- u6-l2 机制：SSC 文件名（el9800hw.c、ecatslv.c、mailbox.c、coeappl.c、sdoserv.c、objdef.c、ecatappl.c）、PDI_Isr/Sync0_Isr 职责（取决于 1C32/1C33）、ECAT_CheckTimer、APPL_GenerateMapping、APPL_AckErrorInd、TOBJECT/Obj0x6040/sRxPDOassign 均标"以 SSC 版本为准"。
- u6-l2 真机：回调签名 UINT16 APPL_StartInputHandler(UINT16 *pIntMask) 以生成代码为准；无应用时 `ethercat states -p0 SAFEOP` 能否成功未实测；0x0440 bit0=0 表示"已到期"凭手册回忆。
- u6-l3：环路周期 1 ms/250 µs/62.5 µs、电流环 10–20 kHz 标典型值；驱动器细插补"因厂商而异"；606C 单位、6041 bit13 后行为"因厂商而异"；"6065=0xFFFFFFFF 关闭跟随误差监视"凭 CiA402 回忆；最大步长 52 429 counts 算例（20 位编码器、3000 rpm、6091/6092=1:1）。
未解决：深色主题未截图目测。

## B — u2-l1(7 步+初始) u2-l2(9 步+初始) u2-l3(7 步+初始) u2-l4(6 步+初始)：_check OK；无头 Chrome 走完全部步骤无 warn/error；深色最后一步截图修两处溢出；最窄测到 485px（390px 未测）
页内互动：u2-l1 点击寄存器地图出详情（事件委托到 .anim-stage）+ 0x0130 逐位解码器。
契约缺陷：hot 作用于 <g> 只剩外发光（已修 site.css 并在 site.js 注释说明）；SVG 内交互需委托到 .anim-stage（已写进 site.js 注释）。
对附录 A 的异议：
1. u2-l3 "逻辑地址 0x00010000 起" → IgH 第一个域从 0x00000000 起，页面用 0x00000000 以与 domains -v 一致。
2. u2-l4 "与 ESI XML 对照" → IgH 不读 ESI，而是把 SII 身份与 ecrt_master_slave_config() 的厂商号/产品号比较；页面分"TwinCAT 类工具对照 ESI / IgH 对照程序期望值"两种讲。
3. u2-l2 规格写 8 步但列了 10 个动作，合并为 9 步。LRW 规则与 A 一致（读 +1、写 +2、读写 +3）。
待抽查：
- u2-l1 真机：0x0000 "ET1100 = 0x11"，其他芯片"见各自手册"；LAN9252 写成 3 FMMU / 4 SM / 4 KB RAM 凭记忆；reg_read 输出"0x08 0x00"逐字节格式；0x0010 只写"非 0，与 slaves -v 一致"。
- u2-l1 动画详情：0x0007 端口描述编码、0x0100 DL Control 宽 4 字节、0x0110 各位定义。机制：AL 寄存器 bit6 以上"保留或厂商相关"。
- u2-l2 机制：SM 状态字节只写 bit3 邮箱满、bit4–5 三缓冲状态；0x0442 看门狗计数清零方式"见芯片手册"；0x0410 PDI 看门狗过期反映在 0x0110 bit1；看门狗过期后"ESC 复位自带数字输出"；SM0–3 控制字节 0x26/0x22/0x64/0x20 标为惯例"以 SII/ESI 为准"。
- u2-l2 真机：SM0 8 字节示例与 pdos 的 SM 行"因从站而异"。
- u2-l3 真机：domains -v 输出"1.5 与 1.6 略有差异"；FMMU 物理地址 0x1100/0x1180 为示例。机制：位级映射"查芯片手册"；"IgH 域同时含输入输出用 LRW，单向用 LRD/LWR"需对照源码。Q4：WKC 少 2 的例子依赖从站栈行为。
- u2-l4 机制：SII 0x003E–0x003F 容量编码"见 ETG.2010"；类别只列 10/30/40/41/50/51/60；0x0502 位（bit8–10 命令、bit15 忙、bit6 读 4/8 字节）凭记忆，bit11–14 "见芯片手册"；SyncM 类别每 SM 8 字节布局与类型码 1–4 需对照 ETG.2010。
- u2-l4 真机：`ethercat sii_read -v` 选项是否存在；slaves -v 身份段字段名、首个类别"常见为 Strings"。主从：IgH 身份不匹配"不挂配置、从站不往上升"未给 dmesg 原文。示例值 Vendor 0x00001234 / Product 0x00005678 / Revision 0x00010000 已标"示例值"。
未实现：无。

## E — u5-l1(9 步+初始) u5-l2(7 步+初始) u5-l3(8 步+初始)：_check OK；无头 Chrome 无 fx 警告/JS 错误；回第 0 步一致；375px 无横向滚动；浅/深主题截图可读
页内互动：u5-l1 6041/6040 逐位解码器（输入框 + 预设，Academy.bitsTable）。
契约缺陷：长课名在 pager/next-card 中无断点撑宽手机页（已修 site.css：pager/next-card/侧栏/首页链接 overflow-wrap:anywhere）；fx.move 只能平移，宽度变化用 attr 无过渡（不影响功能，未改）。
对附录 A 的异议：
1. u5-l3 "60FD 数字输入的抱闸位"：CiA402 标准 60FD 只有 bit0 负限位、bit1 正限位、bit2 原点、bit3 interlock，无抱闸位 → 写为抱闸反馈若有一般在 bit16–31 或厂商对象，因厂商而异；补充标准对象 60FE:01 bit0 "set brake"。
2. u5-l1 "0x80 复位"：须前一周期 bit7=0 才构成上升沿；u5-l1 前值 0x0002 可直接写 0x0080，u5-l3 先写 0x0000 再写 0x0080。
3. u5-l2 模式：附录列 7 种，页面按标准补 VL(2)、IP(7)，6502 位图完整列出。u5-l2 顺序把 HM 提到 CSP 前（CSP→CSV→CST 连续演示闭环分界线右移）。
待抽查：
- u5-l1 真机：SDO 写 6040 是否允许/在哪个 ESM 状态"因厂商而异"；6040 已映射进 PDO 时 SDO 写会被覆盖；6041 期望值 0x0250/0x0240、0x1637、0x0218/0x0238 为典型值，"只保证低 7 位判定"。
- u5-l1 机制：6040 bit8 Halt "支持的模式下按 605D 暂停运动"。
- u5-l2 机制：CSP/CSV/CST 下 6041 bit10 "因厂商而异"；bit12 名称各手册不一；PV bit12 "Speed（1=速度为 0）"、bit13 "Max slippage error"、CSV/CST bit13 "保留"凭记忆；CSP 细插补周期"因厂商而异"；对象号 6042、6087、60C1、60B0/60B1/60B2 建议核对。
- u5-l2 真机：60C2:01/02 示例 1/−3；"部分驱动器改从 1C32 取周期"；6502 示例 0x000003AD "因产品而异"。
- u5-l3 机制：605E 取值默认值与适用范围因厂商而异；605B/605C 取值 0/1、605D 取值 1–4 凭记忆；"减速斜坡通常取 6084"；抱闸延时对象号与默认值因厂商而异，"几十到上百毫秒"为经验量级；603F 示例 0x2310/0x3210/0x3220/0x4310/0x8611（尤其 0x3220、0x8611）与 CiA301 大类需抽查。
- u5-l3 主从：ecrt_slave_config_emerg_pop()"以 ecrt.h 为准"（记忆中 IgH 1.5.2 起提供，未核实）。
- u5-l3 真机：60FE:01 bit0 set brake 实现与极性因厂商而异；605A/605E "常见 2"；1001 示例 0x09 为示意。
未实现：无。

---
# v1.1.0（2026-09-27）

## C — u3-l2 改版「邮箱协议族与 CoE SDO」：_check OK；10 画面（初始+9），回第 0 步一致；1200/375px 无溢出
改动：机制拆解 4→7 节（新增邮箱协议族 Type 表 0 ERR/1 AoE/2 EoE/3 CoE/4 FoE/5 SoE/15 VoE、CoE 服务类型 1–8、Emergency 报文）；真机加 dmesg | grep -i emerg 与 upload 0x1003；Q4 换成服务类型题（Type=3、CoE 头 00 10 → Emergency）；关联链 u3-l0、u5-l3。
待抽查：
- SII 0x001C 位号（bit0 AoE、bit1 EoE、bit2 CoE、bit3 FoE、bit4 SoE、bit5 VoE）凭 ETG.2010 记忆。
- Type 0 "邮箱错误应答（如不支持的 Type）"用例。
- 服务 6、7（远程请求）方向按命名推断，需对照 ETG.1000.6。
- Emergency 示例：0x4310 "CiA402 驱动器过温"、错误寄存器 0x09 "bit0 通用、bit3 温度"需对照 CiA402/CiA301；厂商数据 5 字节"因厂商而异"；IgH 日志格式"因版本而异"；应用侧取 Emergency 接口"以 IgH 版本手册为准"未写 API 名。
- 真机：upload 0x1003 0 期望值（无历史为 0，不支持回 0x06020000）"因厂商而异"。

## D — u0-l1 总图同步：_check OK；8 步不变，回第 0 步一致，375px 无溢出
两协议栈间改为紫线"CoE 邮箱 SDO"（u0-sdo）与蓝线"过程数据 PDO"（u0-pdo），副标题同步；第 4 步蓝线与网线一起流动；"两条通路"图注链 u3-l0。

## E — u5-l3：关联段加 CoE Emergency 上报同一错误码、链 u3-l2。_check OK。

## 契约层（执行 session）
curriculum 登记 u3-l0 并改两课课名、调整 u3-l1/u3-l2 前置；site.js 课数改为按 LESSONS.length 计算；总图两协议栈间拆成 CoE 邮箱 SDO（紫）/过程数据 PDO（蓝）两线、ESM 标签在上、网线标签下移避免重叠，协议栈副标题更新；index/README "22 课"；glossary 新增索引/子索引、VAR、ARRAY、RECORD、SDO Info、Complete Access，OD 与 0x1018 首次出现改 u3-l0（共 164 条）。

## H — u3-l0「CoE 与对象字典」（新课）：_check OK；10 步（含初始，第 1 步"CoE 的位置"）；回第 0 步一致；375px 无溢出（含展开 1C32 卡片）；浅/深主题截图可读
页内互动：对象浏览器 34 条（通信区 14、行规区 20，含规格外的 0x6092），数据在 #od-data，按分区筛选、按索引前缀搜索、属性卡片含"在哪一课用到"。机制拆解 5 节（首节"CoE 在栈里的位置"）。
契约缺陷（已修 site.css）：.box-muted 顺序导致不能叠加（挪到 .box 之后）；fx.hot 作用于 .box 描边仍为 --line（.box.is-hot 描边改 --bus）。
对规格的异议：
1. "6041 默认 0"——CiA402 未规定默认值，改"因厂商而异"。
2. 误区"CLI 索引十六进制、子索引十进制"不准：IgH CLI 按 C 规则解析（0x 前缀十六进制、无前缀十进制——6041 会被当成 0x1799、0 开头八进制）；sdos 输出里子索引按十六进制显示。误区已改写。
3. 规格 4 条误区超上限 3 条；"CoE 借用 CiA 301"是事实不是误区，改为误区后的 .note。
4. 0xA000–0xFFFF：CiA 301 为保留/其他用途，ETG 模块化设备行规用其中 0xF000 起一段；未笼统写成"模块化设备行规区"。
5. 6065 单位按 CiA402 是位置单位（经 6091/6092），写"未配置换算时很多驱动器即编码器增量，因厂商而异"。
待抽查：
- 动画：VAR 卡片默认值"因厂商而异"；固件 abort code 越界 0x06090030、写只读 0x06010002、状态不允许 0x08000022（"以固件实现为准"）。
- 机制·分区：ETG.5001 用 0xF000 起一段、0xF000 模块化设备描述（凭记忆）；厂商区"因厂商而异"；数据类型区"0x0001–0x025F 用于类型定义"（凭记忆）。
- 机制·对象：CoE 访问权限可按 PREOP/SAFEOP/OP 分别规定；ecrt_slave_config_complete_sdo() 接口名；是否支持 Complete Access "以 ESI/手册为准"。
- 机制·来源：SDO Info = CoE 服务 8、OpCode 0x01–0x07 分配、Get Entry Description 返回字段（凭记忆）；ethercat sdos 示例输出与列含义（r-r-r- 按 PREOP/SAFEOP/OP、子索引两位十六进制，已标"示意"）；"IgH 扫描时缓存对象字典，不支持 SDO Info 时列表为空"。
- 机制·两条路："有的从站在 SAFEOP/OP 拒绝对已映射 RxPDO 对象的 SDO 写，因厂商而异"；"未配置换算时位置单位即编码器增量，因厂商而异"。
- 机制·CoE 位置：Emergency "从站放进 SM1、主站读邮箱时取回"。
- 对象浏览器：34 条访问权限/PDO 可映射性按标准或常见做法（页脚注"以 ESI 和 SDO Info 为准"），标"因厂商而异"的：1600、1A00、1C12、1C13、1C32、1C33、605A、605E、6065、6081、6083、6084、60FE；默认值一律"因厂商而异"；1008/1009/100A 写 const；1010/1011 签名 0x65766173 "save"、0x64616F6C "load"，1011 "复位后生效以手册为准"；数据类型 PDO_MAPPING 0x0021、IDENTITY 0x0023；1C32:01 取值 0/1/2/3 与 :02–:06 名称，1C33:01 只写"见 ETG.1020"；6065 "0xFFFFFFFF 关闭监控"；6502 位图、60FD/60FE 位定义、60C2 公式、6091/6092 子索引名；1000 "0x0192 = 402"。
- 真机：upload/sdos 输出格式"以版本为准"；设备名"因厂商而异"；6061 回读更新时机"因厂商而异"。
未实现：无。

## D — u0-l1 名词速览卡：6 条（ESM 四态→u3-l1、6040/6041→u5-l1、607A/6064→u5-l1、SDO→u3-l2、PDO→u3-l3、对象字典→u3-l0），375px 单列无溢出，_check OK；"只读写寄存器"改为无歧义措辞。

## G — u7-l1 规范地图：_check OK；375px 无溢出；机制拆解 4 节
14 行：ETG.1000.2→u1-l1；.3→u1-l2/u1-l3；.4→u1-l2/u1-l3/u2-l1/u2-l2/u2-l3/u4-l1；.5→u3-l1/u3-l2；.6→u3-l0/u3-l1/u3-l2/u3-l3；ETG.1020→u4-l2；ETG.2000（ESI）→u2-l4；ETG.2010（SII）→u2-l4；ETG.5001→u3-l0；CiA 301→u3-l0/u3-l2/u3-l3；CiA 402→u5；ESC 手册→u2-l1/u2-l2/u2-l3/u4-l1；IgH 手册→u6-l1/u7-l1；SSC→u6-l2。表前说明 ETG.1000 服务定义/协议规范成对；注"编号与分工以 ETG 官网目录为准"。
对附录 B 的异议：ESI 与 SII 拆成 ETG.2000/ETG.2010；帧格式、命令码、WKC、寄存器、SM、FMMU、DC 放 .4（附录把帧格式挂在 .3）；.5 是应用层服务定义（含 ESM 与邮箱各协议服务），ESM/AL 码/邮箱头/CoE 编码在 .6；.6 多链 u3-l3。
待抽查：.3/.4 分工按惯例推断未对原文；AL 状态码表与 SDO abort code 在 .6 的具体章节（也可能在 ETG.1020/CiA 301）；.2 "100BASE-TX、E-Bus 等介质"覆盖范围；ETG.1020 只列同步模式与 1C32/1C33；ETG.5001 未写子部分编号；CiA 402 只写 IEC 61800-7 未写 -201/-301；SSC 产品号 ET9300 凭记忆。建议：是否加 ETG.6010（CiA402 实施指南）由设计方定。

## H — u3-l0 先知道这些：6 条（CiA402 对象 6040/6041/6060→u5-l1/u5-l2；607A/6064→u5-l2；PDO 映射 0x1600/0x1C12→u3-l3；0x1C32→u4-l2；abort code→u3-l2；位置单位 6065/6091→u6-l3）。_check OK，回归无误。H 自述：定义按各课主题概括，未逐条对照详讲课原文措辞，建议抽看一致性。

## I — 14 课"先知道这些"：_check 14/14；375px 抽查 u1-l3/u2-l2/u4-l2/u5-l3 无溢出、单栏、无报错
条数：u1-l1 3 · u1-l2 4 · u1-l3 6 · u2-l1 5 · u2-l2 5 · u2-l3 3 · u2-l4 3 · u3-l1 4 · u3-l2 2 · u3-l3 3 · u4-l1 2 · u4-l2 5 · u5-l2 3 · u5-l3 2
对附录 B 的异议与处理：
1. u4-l2 "1C32/1C33 已教于 u3-l0"——u3-l0 正文只讲 1C12/1C13，但对象浏览器含 0x1C32/0x1C33，回链有落点，保留；详讲仍是 u4-l2。
2. u4-l1 附录只一条，拆成"同步模式""DC 同步"两条，均指向 u4-l2。
3. u6-l1 正文没讲 PREEMPT_RT（SCHED_FIFO/mlockall 只在代码里）→ 已让 F 在 u6-l1 补一节"实时前提"。
4. u1-l3 6 条未合并，正好到上限。
已按执行 session 要求修正：u2-l1 看门狗"输出 SM 超时未被写入即过期；ESC 复位输出，固件据此退 SAFEOP"；u2-l3 "PREOP 只走邮箱；SAFEOP 起周期交换、仅输入有效，OP 输出才生效"。
待抽查：u1-l3 参考时钟"通常是第一台带 DC 的"（IgH 默认、可配置）；u3-l1 "PDO 总长须与 SM2/SM3 长度一致"（PREOP→SAFEOP 检查，0x001D/0x001E）；u5-l2 跟随误差"位置指令与实际位置之差"（CiA402 为 6062−6064，u6-l3 图画 607A 对 6064）；u4-l2 PREEMPT_RT "让内核几乎处处可抢占"概括；u2-l2 CoE "沿用 CANopen 对象字典与 SDO/PDO 应用层"简化。

## 术语表（执行 session）：补 EC_READ_*/EC_WRITE_*（u6-l1）、0x6091/0x6092/位置单位/功率级（u6-l3）、EMCY/SDO Abort Code/0x1001/0x1003（u3-l2），共 173 条。
## 契约层补充：.box-muted 移到 .box 之后；.box.is-hot 描边 --bus；_template 加"先知道这些"示例；site.css .pre-terms/.lid-chip（窄屏单列）；_check.py 校验 pre-terms 链接存在。

## F — u6-l1 补"实时前提：PREEMPT_RT、SCHED_FIFO、mlockall"（表：机制/抖动来源/示例对应处，isolcpus 标可选，无数值）。_check OK，375px 无溢出。待抽查：uname -v 显示 "PREEMPT_RT"/"PREEMPT RT" 字样凭记忆。
