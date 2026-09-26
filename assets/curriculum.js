/* EtherCAT 学院课程目录 —— 契约文件，由执行 session 维护，课页 agent 不要修改。
 * highlight 取值只能是系统总图层键：
 * planner rt-loop cia402-m master-stack nic cable esc slave-stack cia402-s motor-ctrl power-stage motor
 */
window.ACADEMY_CURRICULUM = {
  title: 'EtherCAT 学院',
  version: '1.0.0',
  layers: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable',
           'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
  units: [
    { id: 'u0', no: 'U0', title: '全景', lessons: [
      { id: 'u0-l1', title: '系统总图：主站、网线、从站、电机', hours: 1,
        highlight: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable', 'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
        prereq: [] }
    ]},
    { id: 'u1', no: 'U1', title: '物理层与帧', lessons: [
      { id: 'u1-l1', title: '拓扑与端口：帧怎么走一圈', hours: 1.5,
        highlight: ['nic', 'cable', 'esc'], prereq: ['u0-l1'] },
      { id: 'u1-l2', title: '帧结构：以太网头到 WKC', hours: 1.5,
        highlight: ['master-stack', 'nic', 'cable'], prereq: ['u1-l1'] },
      { id: 'u1-l3', title: '寻址与命令：飞行读写与 WKC', hours: 1.5,
        highlight: ['master-stack', 'cable', 'esc'], prereq: ['u1-l2'] }
    ]},
    { id: 'u2', no: 'U2', title: 'ESC 从站控制器', lessons: [
      { id: 'u2-l1', title: 'ESC 内存映射与关键寄存器', hours: 1.5,
        highlight: ['esc'], prereq: ['u1-l3'] },
      { id: 'u2-l2', title: '同步管理器 SM：邮箱模式与三缓冲', hours: 1.5,
        highlight: ['esc', 'slave-stack'], prereq: ['u2-l1'] },
      { id: 'u2-l3', title: 'FMMU 与逻辑地址空间', hours: 1.5,
        highlight: ['master-stack', 'esc'], prereq: ['u1-l3', 'u2-l2'] },
      { id: 'u2-l4', title: 'EEPROM/SII 与 ESI：从站的身份证', hours: 1,
        highlight: ['master-stack', 'esc'], prereq: ['u2-l1'] }
    ]},
    { id: 'u3', no: 'U3', title: '协议与状态机', lessons: [
      { id: 'u3-l1', title: 'ESM 状态机：INIT 到 OP', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l1', 'u2-l2'] },
      { id: 'u3-l2', title: '邮箱与 CoE SDO', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l2', 'u3-l1'] },
      { id: 'u3-l3', title: 'PDO 映射与过程映像', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l3', 'u3-l2'] }
    ]},
    { id: 'u4', no: 'U4', title: '时间同步', lessons: [
      { id: 'u4-l1', title: '分布式时钟 DC', hours: 2,
        highlight: ['master-stack', 'cable', 'esc'], prereq: ['u1-l3', 'u2-l1'] },
      { id: 'u4-l2', title: '同步模式与主站周期', hours: 1.5,
        highlight: ['rt-loop', 'master-stack', 'esc', 'slave-stack'], prereq: ['u4-l1', 'u2-l2'] }
    ]},
    { id: 'u5', no: 'U5', title: 'CiA402 驱动器', lessons: [
      { id: 'u5-l1', title: 'CiA402 状态机与控制字、状态字', hours: 1.5,
        highlight: ['cia402-m', 'cia402-s'], prereq: ['u3-l3'] },
      { id: 'u5-l2', title: '运行模式：PP/PV/TQ/HM/CSP/CSV/CST', hours: 1.5,
        highlight: ['cia402-m', 'cia402-s', 'motor-ctrl'], prereq: ['u5-l1'] },
      { id: 'u5-l3', title: '故障、急停与抱闸', hours: 1.5,
        highlight: ['cia402-s', 'motor-ctrl', 'power-stage', 'motor'], prereq: ['u5-l1'] }
    ]},
    { id: 'u6', no: 'U6', title: '软件实现', lessons: [
      { id: 'u6-l1', title: '主站程序：IgH 架构与周期任务', hours: 2,
        highlight: ['rt-loop', 'cia402-m', 'master-stack', 'nic'], prereq: ['u3-l3', 'u4-l2', 'u5-l1'] },
      { id: 'u6-l2', title: '从站固件：协议栈与中断', hours: 2,
        highlight: ['esc', 'slave-stack', 'cia402-s'], prereq: ['u3-l1', 'u3-l3', 'u4-l2'] },
      { id: 'u6-l3', title: '电机控制链：三环、FOC 与插补', hours: 2,
        highlight: ['planner', 'motor-ctrl', 'power-stage', 'motor'], prereq: ['u5-l2'] }
    ]},
    { id: 'u7', no: 'U7', title: '综合诊断', lessons: [
      { id: 'u7-l1', title: '诊断工具箱', hours: 1.5,
        highlight: ['master-stack', 'nic', 'cable', 'esc'], prereq: ['u6-l1'] },
      { id: 'u7-l2', title: '故障案例集与诊断决策树', hours: 2.5,
        highlight: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable', 'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
        prereq: ['u7-l1'] }
    ]}
  ]
};
