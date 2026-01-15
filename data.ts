
import { Sentence } from './types';

export const WFD_DATA: Sentence[] = [
  {
    id: "44030",
    english: "The assessment procedure has been changed slightly since last year.",
    chinese: "自去年以来，评估程序已经做了些许调整。",
    segments: ["The assessment procedure", "has been changed slightly", "since last year"],
    tips: "注意 assessment (双s) 和 procedure (u不是o) 的拼写。has been changed 是被动语态。",
    difficulty: 1
  },
  {
    id: "44028",
    english: "Your boss wants you to finish this report by Monday.",
    chinese: "你的老板要求你在周一之前完成这份报告。",
    segments: ["Your boss", "wants you to finish this report", "by Monday"],
    tips: "注意 boss 后面的 wants (单三形式)。by Monday 表示在周一截止。",
    difficulty: 1
  },
  {
    id: "44016",
    english: "Having enough sleep has many positive benefits.",
    chinese: "充足的睡眠有许多积极的益处。",
    segments: ["Having enough sleep", "has many positive benefits"],
    tips: "Having enough sleep 是动名词短语做主语，谓语动词用单数 has。注意 benefits 复数形式。",
    difficulty: 1
  },
  {
    id: "44012",
    english: "The glittering of the lake camouflages the fish.",
    chinese: "湖面的波光使鱼儿难以被发现。",
    segments: ["The glittering of the lake", "camouflages the fish"],
    tips: "难点词：glittering (闪烁), camouflage (伪装/掩护)。注意 camouflages 也是单三形式。",
    difficulty: 3
  },
  {
    id: "44000",
    english: "The program helps students develop a better understanding of geography.",
    chinese: "该课程有助于学生更好地理解地理知识。",
    segments: ["The program", "helps students", "develop a better understanding of geography"],
    tips: "help somebody (to) do something，这里省略了 to。geography (地理) 拼写注意。",
    difficulty: 2
  },
  {
    id: "43998",
    english: "Please return the textbooks to the correct bookshelves in the library.",
    chinese: "请将课本归放到图书馆的正确书架上。",
    segments: ["Please return the textbooks", "to the correct bookshelves", "in the library"],
    tips: "textbooks 和 bookshelves 都是复数。注意 bookshelf 的复数是 bookshelves。",
    difficulty: 2
  },
  {
    id: "43992",
    english: "The contract will be signed by the owner of the company.",
    chinese: "这份合同将由公司的所有者签署。",
    segments: ["The contract", "will be signed", "by the owner", "of the company"],
    tips: "典型被动语态 will be signed by...",
    difficulty: 1
  },
  {
    id: "43546",
    english: "Meteorology is the detailed study of the Earth's atmosphere.",
    chinese: "气象学是对地球大气层的详细研究。",
    segments: ["Meteorology is", "the detailed study", "of the Earth's atmosphere"],
    tips: "学术词：Meteorology (气象学), atmosphere (大气层)。注意 Earth's 的撇号。",
    difficulty: 3
  }
];
