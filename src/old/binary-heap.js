class BinaryHeap {
  constructor(scoreFunction = n => n) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  bubbleUp = N => {
    // Fetch the element that has to be moved.
    const element = this.content[N];
    const score = this.scoreFunction(element);
    let n = N;
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.content[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
      if (score < this.scoreFunction(parent)) {
        // Otherwise, swap the parent with the current element and
        // continue.
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      } else {
        // exit the loop;
        n = 0;
      }
    }
  }

  sinkDown = N =>{
    // Look up the target element and its score.
    const length = this.content.length;
    const element = this.content[N];
    const elemScore = this.scoreFunction(element);
    let swap = element;
    let n = N;
    while(swap) {
      // Compute the indices of the child elements.
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      swap = null;
      // If the first child exists (is inside the array)...
      let child1Score;
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = this.content[child1N],
        child1Score = this.scoreFunction(child1);
        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = this.content[child2N],
        child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score))
          swap = child2N;
      }

      // if there is a swappable element
      if (swap) {
        // swap and continue.  
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // else we'll exit the loop.
    }
  };
  size = () => this.content.length;
  push = element => {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  };
  pop = () => {
    // Store the first element so we can return it later.
    const result = this.content[0];
    // Get the element at the end of the array.
    const end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  };
  remove = value => {
    const length = this.content.length;
    const i = this.content.indexOf(value);
    const end = this.content.pop();
    if (i !== length - 1) {
      this.content[i] = end;
      this.bubbleUp(i);
      this.sinkDown(i);
    }
  }
}

export default BinaryHeap;
