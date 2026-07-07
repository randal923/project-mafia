import type { Job, JobBoardNote, JobBoardString } from "./jobTypes";

const emptyNoteSize =
  "h-[clamp(5.5rem,12vw,9.5rem)] w-[clamp(5rem,11vw,8.5rem)]";

export const jobBoardStrings: JobBoardString[] = [
  { id: "center-to-register", className: "w-[38%] rotate-[-145deg]" },
  { id: "center-to-north", className: "w-[31%] rotate-[-92deg] max-sm:hidden" },
  { id: "center-to-northeast", className: "w-[35%] rotate-[-39deg]" },
  { id: "center-to-east", className: "w-[37%] rotate-[3deg]" },
  { id: "center-to-southeast", className: "w-[38%] rotate-[42deg]" },
  { id: "center-to-southwest", className: "w-[34%] rotate-[128deg] max-sm:hidden" },
  { id: "center-to-west", className: "w-[36%] rotate-[183deg]" },
];

export const cornerRegisterJob: Job = {
  description:
    "A quick corner-store score with a quiet counter, a full till, and a narrow window before patrols pass.",
  id: "corner-register",
  imageAlt: "Brass cash register on a worn corner shop counter",
  imageSrc: "/assets/jobs/corner-register.png",
  name: "Corner Register",
  story: {
    intro:
      "The corner bodega on Hester keeps the register drawer light but loose. After supper, the clerk checks stock in the back, the owner steps upstairs with invoices, and the front bell is the only warning system.",
    choices: [
      {
        detail:
          "Linger by the newspapers until the clerk carries a crate into the stockroom.",
        id: "wait-for-stock",
        label: "Wait for stock",
        paths: [
          {
            followUp:
              "Thumb the sale key, lift the small bills, close the drawer, and buy a soda on the way out so the missing cash looks like a bad count.",
            id: "quiet-drawer",
            name: "Quiet Drawer",
            payout: "$22-$28",
            risk: "low",
          },
        ],
      },
      {
        detail:
          "Buy gum with a large bill and keep the clerk talking through the count.",
        id: "run-change-game",
        label: "Run change game",
        paths: [
          {
            followUp:
              "Fold a returned five under your palm, correct the clerk once, then let the confusion settle as an honest register mistake.",
            id: "short-change",
            name: "Short Change",
            payout: "$20-$25",
            risk: "low",
          },
        ],
      },
      {
        detail:
          "Offer to move delivery crates through the side door while the clerk watches the alley.",
        id: "carry-crates",
        label: "Carry crates",
        paths: [
          {
            followUp:
              "When the clerk turns to stack fruit, lift the delivery envelope from under the scale and leave before the owner comes down.",
            id: "back-counter-envelope",
            name: "Back Counter Envelope",
            payout: "$27-$34",
            risk: "medium",
          },
        ],
      },
      {
        detail:
          "Slip behind the curtain and try the owner's cash tin before the bell gives you away.",
        id: "push-office",
        label: "Push the office",
        paths: [
          {
            followUp:
              "If the office door sticks open, grab the week's petty cash and run before anyone gets a clean look at your coat.",
            id: "owners-tin",
            name: "Owner's Tin",
            payout: "$70-$95",
            risk: "high",
          },
          {
            followUp:
              "If footsteps hit the stairs, leave the tin, settle for the register, and take the heat for being seen near the counter.",
            id: "hot-exit",
            name: "Hot Exit",
            payout: "$24-$30",
            risk: "medium",
          },
        ],
      },
    ],
  },
};

export const jobBoardNotes: JobBoardNote[] = [
  {
    id: "corner-register-note",
    job: cornerRegisterJob,
    paperClassName: "bg-[linear-gradient(180deg,#ded2a7,#bca66d)]",
    positionClassName: "left-[5%] top-[7%]",
    rotateClassName: "rotate-[-4deg]",
    sizeClassName: "h-[clamp(16rem,31vw,19rem)] w-[clamp(13rem,20vw,17rem)]",
  },
  {
    id: "north-note",
    paperClassName: "bg-[linear-gradient(180deg,#cfc5aa,#958864)]",
    positionClassName: "left-[46%] top-[6%] max-sm:hidden",
    rotateClassName: "rotate-[3deg]",
    sizeClassName: emptyNoteSize,
  },
  {
    id: "northeast-note",
    paperClassName: "bg-[linear-gradient(180deg,#d5c7a0,#a48b5f)]",
    positionClassName: "right-[7%] top-[10%]",
    rotateClassName: "rotate-[5deg]",
    sizeClassName: emptyNoteSize,
  },
  {
    id: "west-note",
    paperClassName: "bg-[linear-gradient(180deg,#bbb9a5,#787c58)]",
    positionClassName: "left-[8%] top-[54%]",
    rotateClassName: "rotate-[6deg]",
    sizeClassName: emptyNoteSize,
  },
  {
    id: "east-note",
    paperClassName: "bg-[linear-gradient(180deg,#c9bda4,#927947)]",
    positionClassName: "right-[5%] top-[43%]",
    rotateClassName: "rotate-[-5deg]",
    sizeClassName: emptyNoteSize,
  },
  {
    id: "southwest-note",
    paperClassName: "bg-[linear-gradient(180deg,#c4bfa7,#747750)]",
    positionClassName: "left-[28%] bottom-[8%] max-sm:hidden",
    rotateClassName: "rotate-[-3deg]",
    sizeClassName: emptyNoteSize,
  },
  {
    id: "southeast-note",
    paperClassName: "bg-[linear-gradient(180deg,#d8ceb3,#9b875e)]",
    positionClassName: "right-[22%] bottom-[8%]",
    rotateClassName: "rotate-[4deg]",
    sizeClassName: emptyNoteSize,
  },
];
