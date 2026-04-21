# dragpan

Enable container panning via dragging

```js
import { setDragPan } from "dragpan";

const unset = setDragPan(document.querySelector(".container"), {
  onStart() {
    console.log("start");
  },
  onMove(dx, dy) {
    console.log("move", { dx, dy });
  },
  onEnd() {
    console.log("end");
  },
  wheel: true,
  ignore: "a, button",
});
```
