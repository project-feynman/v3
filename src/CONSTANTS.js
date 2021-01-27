const CORE_TEAM_ID = "mDbUrvjy4pe8Q5s5wyoD";
const PHYSICS_ID = "oQV3TgY3OrvE93lAT7sx";
const TUTORIAL_ID = "FVdgjuywaFgxvyylISt2";

export const LANDSCAPE_WIDTH = 1200; 
export const VERTICAL_MODE_WIDTH = 800; 
export const PPT_SLIDE_RATIO = 3/4; 
export const PDF_RATIO = 11/8.5; 

export const MASSIVE_MODE_DIMENSIONS = {
  HEIGHT: 1300,
  WIDTH: 1400
};

export const ERASER_STROKE_WIDTH = 25;

export const SUPER_USER_EMAILS = [
  "eltonlin@mit.edu",
  // "eltonlin1998@gmail.com", gmail is commented out so I can test the non-admin behavior
  // 8.01 
  // S1~2
  "josephf@mit.edu",
  "pbarral@mit.edu", 
  
  // S3~4
  "rfletch@mit.edu",  // Richard Fletcher
  "nromeo@mit.edu", // Nicolas Romeo

  // S5~6
  "icisse@mit.edu",
  "oandrews@mit.edu", // Owen Andrews
  
  // S7-8
  "hen@mit.edu", // Henderson
  "bacanua@mit.edu", // Alexandru Bacanu

  // S9/S10
  "tegmark@mit.edu", // Max Tegmark 
  "aktan@mit.edu", // Andrew Tan
  
  // S11 - 12
  "padour@mit.edu", // Peter Dourmashkin
  "rmurdock@mit.edu", // Richard Joshua Murdock

  // S13 - 14
  "mohamedr@mit.edu", // Mohamed Abdelhafez
  "crabb@mit.edu", // Emily Crabb

  // utility TAs
  "sgh256@mit.edu", // Simon Grosse-Holz
  "taweewat@mit.edu", // taweewat@mit.edu
  "achatt@mit.edu", // Arkya Chatterjee

  // 18.01
  "larryg@mit.edu",
  "sanjoy@mit.edu",
  "xueyingy@mit.edu",

  // UTAs
  "araminta@mit.edu", // Araminta Gwynne
  "dmal@mit.edu",
  "asantoss@mit.edu",
  "mfedyk@mit.edu",
  "stzh1555@mit.edu",
  "xherbert@mit.edu",

  // ESG
  "pao@mit.edu", // Paula Rabusco
  "jorloff@mit.edu", // Jeremy Orloff

  // 8.022
  "harlow@mit.edu",

  // 6.437
  "gww@mit.edu",
  "polina@mit.edu",
  "chueh@mit.edu",
  "samtenka@mit.edu",
  "zhxzhang@mit.edu"
];

export const DefaultEmailSettings = {
  emailOnNewPost: false,
  emailOnNewReply: true,
  emailDailySummary: false,
  emailWeeklySummary: true
}

export const RecordState = {
  PRE_RECORD: "PRE_RECORD",
  MID_RECORD: "MID_RECORD",
  POST_RECORD: "POST_RECORD"
};

// for when the user is already in the class page
export const tutorial = {
  classId: "mDbUrvjy4pe8Q5s5wyoD",
  postId: "UArEa6JFpuNrjyYI3Th5"
};

// for the home page
export const demoVideo = {
  classId: TUTORIAL_ID, 
  postId: "M13OkhsWLo0XeK5wEElF"
};

export const demoVideo2 = {
  classId: TUTORIAL_ID, 
  postId: "XATdAHroEVJtSAHko5X1"
};

export const BlackboardTools = {
  PEN: "PEN",
  STROKE_ERASER: "STROKE_ERASER",
  NORMAL_ERASER: "NORMAL_ERASER"
}

export const navbarHeight = 64; 
export const toolbarHeight = 50;
export const aspectRatio = 9/16;
export const epsilon = 20;
export const audioPlayerHeight = 52;