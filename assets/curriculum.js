/* EtherCAT 学院课程目录 —— 契约文件，由执行 session 维护，课页 agent 不要修改。
 * highlight 取值只能是系统总图层键：
 * planner rt-loop cia402-m master-stack nic cable esc slave-stack cia402-s motor-ctrl power-stage motor
 */
window.ACADEMY_CURRICULUM = {
  title: 'EtherCAT 学院',
  version: '1.5.1',
  // 非课页（Academy.init 支持的页面 id 与标题）
  pages: { challenges: '单元诊断挑战', capstone: '结业任务', review: '复习' },
  // 速通路径：先把一台驱动器跑起来，其余课在需要时回来补
  fastPath: ['u0-l1', 'u3-l1', 'u3-l3', 'u5-l1', 'u5-l2', 'u6-l1', 'u7-l1', 'u7-l2'],
  layers: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable',
           'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
  units: [
    { id: 'u0', no: 'U0', title: '全景', challenge: true, lessons: [
      { id: 'u0-l1', title: '系统总图：主站、网线、从站、电机', hours: 1,
        highlight: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable', 'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
        prereq: [] }
    ]},
    { id: 'u1', no: 'U1', title: '物理层与帧', challenge: true, lessons: [
      { id: 'u1-l1', title: '拓扑与端口：帧怎么走一圈', hours: 1.5,
        highlight: ['nic', 'cable', 'esc'], prereq: ['u0-l1'] },
      { id: 'u1-l2', title: '帧结构：以太网头到 WKC', hours: 1.5,
        highlight: ['master-stack', 'nic', 'cable'], prereq: ['u1-l1'] },
      { id: 'u1-l3', title: '寻址与命令：飞行读写与 WKC', hours: 1.5,
        highlight: ['master-stack', 'cable', 'esc'], prereq: ['u1-l2'] }
    ]},
    { id: 'u2', no: 'U2', title: 'ESC 从站控制器', challenge: true, lessons: [
      { id: 'u2-l1', title: 'ESC 内存映射与关键寄存器', hours: 1.5,
        highlight: ['esc'], prereq: ['u1-l3'] },
      { id: 'u2-l2', title: '同步管理器 SM：邮箱模式与三缓冲', hours: 1.5,
        highlight: ['esc', 'slave-stack'], prereq: ['u2-l1'] },
      { id: 'u2-l3', title: 'FMMU 与逻辑地址空间', hours: 1.5,
        highlight: ['master-stack', 'esc'], prereq: ['u1-l3', 'u2-l2'] },
      { id: 'u2-l4', title: 'EEPROM/SII 与 ESI：从站的身份证', hours: 1,
        highlight: ['master-stack', 'esc'], prereq: ['u2-l1'] }
    ]},
    { id: 'u3', no: 'U3', title: '协议与状态机', challenge: true, lessons: [
      { id: 'u3-l0', title: 'CoE 与对象字典：从站的参数表与数据模型', hours: 1.5,
        highlight: ['master-stack', 'slave-stack', 'cia402-s'], prereq: ['u2-l1'] },
      { id: 'u3-l1', title: 'ESM 状态机：INIT 到 OP', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l1', 'u2-l2', 'u3-l0'] },
      { id: 'u3-l2', title: '邮箱协议族与 CoE SDO', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l2', 'u3-l0', 'u3-l1'] },
      { id: 'u3-l3', title: 'PDO 映射与过程映像', hours: 1.5,
        highlight: ['master-stack', 'esc', 'slave-stack'], prereq: ['u2-l3', 'u3-l2'] }
    ]},
    { id: 'u4', no: 'U4', title: '时间同步', challenge: true, lessons: [
      { id: 'u4-l1', title: '分布式时钟 DC', hours: 2,
        highlight: ['master-stack', 'cable', 'esc'], prereq: ['u1-l3', 'u2-l1'] },
      { id: 'u4-l2', title: '同步模式与主站周期', hours: 1.5,
        highlight: ['rt-loop', 'master-stack', 'esc', 'slave-stack'], prereq: ['u4-l1', 'u2-l2'] }
    ]},
    { id: 'u5', no: 'U5', title: 'CiA402 驱动器', challenge: true, lessons: [
      { id: 'u5-l1', title: 'CiA402 状态机与控制字、状态字', hours: 1.5,
        highlight: ['cia402-m', 'cia402-s'], prereq: ['u3-l3'] },
      { id: 'u5-l2', title: '运行模式：PP/PV/TQ/HM/CSP/CSV/CST', hours: 1.5,
        highlight: ['cia402-m', 'cia402-s', 'motor-ctrl'], prereq: ['u5-l1'] },
      { id: 'u5-l3', title: '故障、急停与抱闸', hours: 1.5,
        highlight: ['cia402-s', 'motor-ctrl', 'power-stage', 'motor'], prereq: ['u5-l1'] },
      { id: 'u5-l4', title: '限制、回零与探针：让轴在真实机械上安全可用', hours: 1.5,
        highlight: ['cia402-s', 'motor-ctrl', 'motor'], prereq: ['u5-l2', 'u5-l3'] }
    ]},
    { id: 'u6', no: 'U6', title: '软件实现', challenge: true, lessons: [
      { id: 'u6-l1', title: '主站程序：IgH 架构与周期任务', hours: 2,
        highlight: ['rt-loop', 'cia402-m', 'master-stack', 'nic'], prereq: ['u3-l3', 'u4-l2', 'u5-l1'] },
      { id: 'u6-l2', title: '从站固件：协议栈与中断', hours: 2,
        highlight: ['esc', 'slave-stack', 'cia402-s'], prereq: ['u3-l1', 'u3-l3', 'u4-l2'] },
      { id: 'u6-l3', title: '电机控制链：三环、FOC 与插补', hours: 2,
        highlight: ['planner', 'motor-ctrl', 'power-stage', 'motor'], prereq: ['u5-l2'] }
    ]},
    { id: 'u7', no: 'U7', title: '综合诊断', challenge: true, lessons: [
      { id: 'u7-l0', title: '全链路启动时序：从上电到运动', hours: 2,
        highlight: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable', 'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
        prereq: ['u3-l1', 'u5-l1', 'u6-l1'] },
      { id: 'u7-l1', title: '诊断工具箱', hours: 1.5,
        highlight: ['master-stack', 'nic', 'cable', 'esc'], prereq: ['u6-l1', 'u7-l0'] },
      { id: 'u7-l2', title: '故障案例集与诊断决策树', hours: 2.5,
        highlight: ['planner', 'rt-loop', 'cia402-m', 'master-stack', 'nic', 'cable', 'esc', 'slave-stack', 'cia402-s', 'motor-ctrl', 'power-stage', 'motor'],
        prereq: ['u7-l1'] }
    ]}
  ]
};
