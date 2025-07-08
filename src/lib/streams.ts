export interface Stream {
  id: string;
  title: string;
  description: string;
  poster: string;
  streamUrl: string;
}

export const streams: Stream[] = [
  {
    id: "stream-1",
    title: "IND vs ENG Test Match",
    description: "Watch the cricket action live from the stadium.",
    poster: "/live.jpg",
    streamUrl: "https://dai.google.com/ssai/event/hQXQ8apwTJeGKlGD7Oi7lQ/master.m3u8"
  }
]; 