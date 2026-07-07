export type Job = {
  description: string;
  id: string;
  imageAlt: string;
  imageSrc: string;
  name: string;
  story: JobStory;
};

export type JobChoice = {
  detail: string;
  id: string;
  label: string;
  paths: JobPath[];
};

export type JobPath = {
  followUp: string;
  id: string;
  name: string;
  payout: string;
  risk: JobRisk;
};

export type JobRisk = "low" | "medium" | "high";

export type JobStory = {
  choices: JobChoice[];
  intro: string;
};

export type JobBoardNote = {
  id: string;
  job?: Job;
  paperClassName: string;
  positionClassName: string;
  rotateClassName: string;
  sizeClassName: string;
};

export type JobBoardString = {
  className: string;
  id: string;
};
