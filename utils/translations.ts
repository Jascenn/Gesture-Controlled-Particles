

import { HandGesture } from '../types';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // UI General
    appTitle: "EtherBagua",
    loading: "Initializing Quantum Sensor...",
    inputSource: "Input Source",
    sensitivity: "Sensitivity",
    status: "Status",
    active: "Active",
    searching: "Searching",
    cameraError: "Camera Access Required",
    retry: "Try Reconnecting",
    
    // Admin / Menu
    settings: "Settings",
    adminPanel: "System Admin",
    help: "User Guide",
    language: "Language",
    debugMode: "Debug Mode",
    forceGesture: "Force Gesture (God Mode)",
    simSpeed: "Simulation Speed",
    
    // Oracle
    oracleTitle: "Consult the Oracle",
    oraclePlaceholder: "The mists of uncertainty cloud the oracle right now.",
    energy: "ENERGY",
    consult: "Consult the Oracle",
    
    // Instructions
    footerMarquee: "Pan • Point • Pinch • Fist • Expand • Love • Shaka • Portal • Star • Union • Vulcan • Spiderman • Chaos • Vortex • Sphere • Tai Chi",

    // Gesture Labels
    gestures: {
      [HandGesture.NONE]: "Detecting",
      [HandGesture.OPEN_PALM]: "Expand",
      [HandGesture.CLOSED_FIST]: "Focus",
      [HandGesture.POINTING]: "Swirl",
      [HandGesture.VICTORY]: "Peace",
      [HandGesture.THUMBS_UP]: "Like",
      [HandGesture.PINCH]: "Cycle",
      [HandGesture.ROCK]: "Union",
      [HandGesture.LOVE]: "Affection",
      [HandGesture.SHAKA]: "Flow",
      [HandGesture.OK_SIGN]: "Portal",
      [HandGesture.PINKY]: "Stardust",
      [HandGesture.VULCAN]: "Merkaba",
      [HandGesture.SPIDERMAN]: "Web",
      [HandGesture.CROSS]: "Chaos",
      [HandGesture.GUN]: "Vortex",
      [HandGesture.CLAW]: "Sphere",
      [HandGesture.SWORD]: "Tai Chi"
    },

    // Help Modal
    helpTabs: {
        intro: "Introduction",
        gestures: "Gesture Library",
        trouble: "Troubleshooting"
    },
    introText: "EtherBagua is an interactive WebGL experience that fuses ancient Taoist philosophy with modern computer vision. Control the elemental particles using your hand gestures.",
    troubleSteps: [
        "Ensure lighting is sufficient.",
        "Keep your hand within the frame.",
        "Refresh if the camera freezes.",
        "Check browser permissions."
    ]
  },
  zh: {
    // UI General
    appTitle: "以太八卦",
    loading: "正在初始化量子传感器...",
    inputSource: "输入源",
    sensitivity: "灵敏度",
    status: "状态",
    active: "活跃",
    searching: "搜索中",
    cameraError: "需要摄像头权限",
    retry: "尝试重连",

    // Admin / Menu
    settings: "设置",
    adminPanel: "管理后台",
    help: "使用说明",
    language: "语言",
    debugMode: "调试模式",
    forceGesture: "强制手势 (上帝模式)",
    simSpeed: "模拟速度",

    // Oracle
    oracleTitle: "问道于盲",
    oraclePlaceholder: "迷雾遮蔽了神谕...",
    energy: "能量",
    consult: "问道卜卦",

    // Instructions
    footerMarquee: "平移 • 漩涡 • 切换 • 聚焦 • 展开 • 慈爱 • 律动 • 传送门 • 星尘 • 联合 • 瓦肯 • 矩阵 • 混沌 • 漩涡 • 晶球 • 太极",

    // Gesture Labels
    gestures: {
      [HandGesture.NONE]: "检测中",
      [HandGesture.OPEN_PALM]: "展开",
      [HandGesture.CLOSED_FIST]: "聚焦",
      [HandGesture.POINTING]: "漩涡",
      [HandGesture.VICTORY]: "和平",
      [HandGesture.THUMBS_UP]: "点赞",
      [HandGesture.PINCH]: "切换",
      [HandGesture.ROCK]: "联合",
      [HandGesture.LOVE]: "慈爱",
      [HandGesture.SHAKA]: "律动",
      [HandGesture.OK_SIGN]: "传送门",
      [HandGesture.PINKY]: "星尘",
      [HandGesture.VULCAN]: "逻辑",
      [HandGesture.SPIDERMAN]: "矩阵",
      [HandGesture.CROSS]: "混沌",
      [HandGesture.GUN]: "黑洞",
      [HandGesture.CLAW]: "晶球",
      [HandGesture.SWORD]: "太极"
    },

    // Help Modal
    helpTabs: {
        intro: "简介",
        gestures: "手势库",
        trouble: "故障排除"
    },
    introText: "以太八卦（EtherBagua）是一个结合了古代道家哲学与现代计算机视觉的交互式 WebGL 体验。通过手势控制元素粒子的流动与形态。",
    troubleSteps: [
        "确保环境光线充足。",
        "保持手部在摄像头画面内。",
        "如果画面卡顿，请刷新页面。",
        "检查浏览器摄像头权限是否开启。"
    ]
  }
};