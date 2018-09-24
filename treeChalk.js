const chalk = require('chalk');
let fs = require('fs');

function centre(str, len) {
  let excess = Math.max(0, len - str.length);
  return ' '.repeat(excess >> 1) + str + ' '.repeat((excess + 1) >> 1);
}

function makeTree(tokenDependencyArray) {
  let tree = [];
  tree.depth = 0;
  tree.roots = [];

  function getNode(i) {
    if (tree[i] === undefined) {
      let head = tokenDependencyArray[i].dependencyEdge.headTokenIndex;
      if (head === i) {
        tree[i] = {
          parent: undefined,
          level: 0,
          children: [],
        };
        if (!tree.roots.includes(i)) { tree.roots.push(i); }
      } else {
        tree[i] = {
          parent: head,
          level: 1 + getNode(head).level,
          children: [],
        };
        tree.depth = Math.max(tree.depth, tree[i].level);
      }
    }
    return tree[i];
  }

  for (i = 0; i < tokenDependencyArray.length; i++) {
    tree[i] = getNode(i);
    if (tree[i].parent !== undefined) {
      tree[tree[i].parent].children.push(i);
    }
  }

  return tree;
}

function makeColours(tree, maxLevel = Infinity) {
  let colours = [];

  function makeColour(i, [h, s, v], colZone) {
    colours[i] = [h, s, v];
    let colShift = colZone / (tree[i].children.length + 1);
    for (let [j, child] of tree[i].children.entries()) {
      let [newH, newS, newV] = [h, s, v];
      if (tree[i].level < maxLevel) {
        [newH, newS, newV] = [h + (10 + j) * colShift, s * 0.95, v];
      } else {
        newV *= 0.8;
      }
      makeColour(child, [newH, newS, newV], colShift);
    }
  }

  for (sentenceRoot of tree.roots) {
    makeColour(sentenceRoot, [120, 100, 100], 360);
  }
  return colours;
}

function ancestor(tree, i, level) {
  let node = i;
  while (tree[node].level > level) { node = tree[node].parent; }
  return node;
}

function treeChalk(tokenDependencyArray, {maxLevel = Infinity, blank = '', mobileLayout = true}) {
  let tree = makeTree(tokenDependencyArray);
  if (maxLevel === Infinity) {
    for (let level = 0; level <= tree.depth; level++) {
      treeChalk(tokenDependencyArray, {maxLevel: level, blank, mobileLayout});
    }
    return;
  }

  let colours = makeColours(tree, maxLevel);
  blockStr = '';
  wordStr = '';
  partStr = '';
  for (let i = 0; i < tokenDependencyArray.length; i++) {
    let block = '';
    let word = tokenDependencyArray[i].text.content;
    let part = tokenDependencyArray[i].dependencyEdge.label;

    if (tree[i].level === maxLevel) {
      if (tree[i].parent < i - 1) {
        part = `↰ ${part}`;
      } else if (tree[i].parent === i - 1) {
        part = `◄ ${part}`;
      } else if (tree[i].parent === i + 1) {
        part = `${part} ►`;
      } else if (tree[i].parent > i + 1) {
        part = `${part} ↱`;
      } else if (tree[i].parent === undefined) {
        part = `▪${part}▪`;
      }
    } else {
      part = ` ${part} `;
    }
    let maxWidth = Math.max(word.length, part.length);
    word = centre(word, maxWidth);
    part = centre(part, maxWidth);

    let lBoundary = '/';
    let rBoundary = '\\ ';
    if (i > 0 && ancestor(tree, i, maxLevel) === ancestor(tree, i - 1, maxLevel)) {
      lBoundary = '‾';
    }
    if (i < tokenDependencyArray.length - 1 && ancestor(tree, i, maxLevel) === ancestor(tree, i + 1, maxLevel)) {
      rBoundary = '‾‾';
    }
    if (word.length >= 2) {
      block = lBoundary + '‾'.repeat(word.length - 2) + rBoundary;
    } else {
      block = rBoundary;
    }

    let ancestorLabel = tokenDependencyArray[ancestor(tree, i, maxLevel)].dependencyEdge.label;
    if (ancestorLabel === blank) { word = ' '.repeat(word.length); }
    if (tree[i].level === maxLevel) { word = chalk.inverse(word); }

    if (mobileLayout && tree[i].level < maxLevel) {
      block = ' '.repeat(block.length);
      word = ' '.repeat(word.length);
      part = ' '.repeat(part.length);
    }

    blockStr += block;
    wordStr += chalk.hsv(colours[i])(`${word} `);
    partStr += chalk.hsv(colours[i])(`${part} `);
  }
  console.log();
  console.log(blockStr);
  console.log(wordStr);
  console.log(partStr);
}

if (process.argv.length < 3) {
  console.log('Usage: node treeChalk.js FILENAME');
  console.log('The file should be a syntax tree from the Google API.')
  process.exit(1);
}
let filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, data) {
  if (err) throw err;

  // TODO: accept command line arguments to pass to treeChalk function
  syntaxTree = JSON.parse(data);
  treeChalk(syntaxTree.tokens, { mobileLayout: true });
});