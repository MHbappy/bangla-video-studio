// গুরুত্বপূর্ণ শব্দ: সংখ্যা, দাম (৳), শতাংশ, আর ইংরেজি হরফের নাম (ESP32, 6000W, ATI Laser)
export const isKeyword = (word: string) => /[0-9০-৯৳%]|[A-Za-z]{2,}/.test(word);
