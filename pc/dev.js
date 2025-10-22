// let devToolsOpen = false;

// setInterval(() => {
//   const obj = {};
//   Object.defineProperty(obj, 'id', {
//     get: function() {
//       devToolsOpen = true; // This getter is only called when console.log processes the object
//       return 'devToolsDetector';
//     }
//   });
//   console.log(obj);
//   // Clear the console to prevent excessive logging if DevTools are open
//   console.clear(); 

//   if (devToolsOpen) {
//     console.log("DevTools detected via console.log trick!");
//     // Take action
//     devToolsOpen = false; // Reset the flag
//   }
// }, 1000);