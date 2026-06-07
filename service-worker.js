chrome.action.onClicked.addListener(async (tab) => {
  // Opens the side panel when the extension icon is clicked
  await chrome.sidePanel.open({ windowId: tab.windowId });
});
