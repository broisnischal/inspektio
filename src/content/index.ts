console.log("Content script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_LOCALSTORAGE") {
    console.log("Received GET_LOCALSTORAGE message from tab " + sender.tab?.id);
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      data[key!] = localStorage.getItem(key) ?? "";
    }

    console.log(message);
    console.log(data);

    sendResponse(data);
    return true; // async response allowed
  }
});
