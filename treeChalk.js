const chalk = require('chalk');

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

let exampleSentence = [
  {
    "sentences": [
      {
        "text": {
          "content": "Tomorrow I will make sure to eat at least two meals.",
          "beginOffset": -1
        },
        "sentiment": null
      }
    ],
    "tokens": [
      {
        "text": {
          "content": "Tomorrow",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "NOUN",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "TMOD"
        },
        "lemma": "Tomorrow"
      },
      {
        "text": {
          "content": "I",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "PRON",
          "aspect": "ASPECT_UNKNOWN",
          "case": "NOMINATIVE",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "FIRST",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "NSUBJ"
        },
        "lemma": "I"
      },
      {
        "text": {
          "content": "will",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "AUX"
        },
        "lemma": "will"
      },
      {
        "text": {
          "content": "make",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "ROOT"
        },
        "lemma": "make"
      },
      {
        "text": {
          "content": "sure",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "ADJ",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "ACOMP"
        },
        "lemma": "sure"
      },
      {
        "text": {
          "content": "to",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "PRT",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 6,
          "label": "AUX"
        },
        "lemma": "to"
      },
      {
        "text": {
          "content": "eat",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 4,
          "label": "XCOMP"
        },
        "lemma": "eat"
      },
      {
        "text": {
          "content": "at",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "ADV",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 8,
          "label": "ADVMOD"
        },
        "lemma": "at"
      },
      {
        "text": {
          "content": "least",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "ADV",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 9,
          "label": "ADVMOD"
        },
        "lemma": "least"
      },
      {
        "text": {
          "content": "two",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "NUM",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 10,
          "label": "NUM"
        },
        "lemma": "two"
      },
      {
        "text": {
          "content": "meals",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "NOUN",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "PLURAL",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 6,
          "label": "DOBJ"
        },
        "lemma": "meal"
      },
      {
        "text": {
          "content": ".",
          "beginOffset": -1
        },
        "partOfSpeech": {
          "tag": "PUNCT",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 3,
          "label": "P"
        },
        "lemma": "."
      }
    ],
    "language": "en"
  },
  {"sentences":[{"text":{"content":"The Code of Hammurabi decreed that bartenders who watered down beer would be executed.","beginOffset":-1},"sentiment":null}],"tokens":[{"text":{"content":"The","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":1,"label":"DET"},"lemma":"The"},{"text":{"content":"Code","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"NSUBJ"},"lemma":"Code"},{"text":{"content":"of","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":1,"label":"PREP"},"lemma":"of"},{"text":{"content":"Hammurabi","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"POBJ"},"lemma":"Hammurabi"},{"text":{"content":"decreed","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"ROOT"},"lemma":"decree"},{"text":{"content":"that","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":13,"label":"MARK"},"lemma":"that"},{"text":{"content":"bartenders","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"PLURAL","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":13,"label":"NSUBJPASS"},"lemma":"bartender"},{"text":{"content":"who","beginOffset":-1},"partOfSpeech":{"tag":"PRON","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"NSUBJ"},"lemma":"who"},{"text":{"content":"watered","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"RCMOD"},"lemma":"water"},{"text":{"content":"down","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"PRT"},"lemma":"down"},{"text":{"content":"beer","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"DOBJ"},"lemma":"beer"},{"text":{"content":"would","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":13,"label":"AUX"},"lemma":"would"},{"text":{"content":"be","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":13,"label":"AUXPASS"},"lemma":"be"},{"text":{"content":"executed","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"PASSIVE"},"dependencyEdge":{"headTokenIndex":4,"label":"CCOMP"},"lemma":"execute"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"P"},"lemma":"."}],"language":"en"},
  {"sentences":[{"text":{"content":"The Persian army, alleged by the ancient sources to have numbered over one million, but today considered to have been much smaller, arrived at the pass in late August or early September.","beginOffset":-1},"sentiment":null}],"tokens":[{"text":{"content":"The","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"DET"},"lemma":"The"},{"text":{"content":"Persian","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"AMOD"},"lemma":"Persian"},{"text":{"content":"army","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":25,"label":"NSUBJ"},"lemma":"army"},{"text":{"content":",","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"P"},"lemma":","},{"text":{"content":"alleged","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"VMOD"},"lemma":"allege"},{"text":{"content":"by","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"PREP"},"lemma":"by"},{"text":{"content":"the","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"DET"},"lemma":"the"},{"text":{"content":"ancient","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"AMOD"},"lemma":"ancient"},{"text":{"content":"sources","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"PLURAL","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":5,"label":"POBJ"},"lemma":"source"},{"text":{"content":"to","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":11,"label":"AUX"},"lemma":"to"},{"text":{"content":"have","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":11,"label":"AUX"},"lemma":"have"},{"text":{"content":"numbered","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"XCOMP"},"lemma":"number"},{"text":{"content":"over","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":11,"label":"PREP"},"lemma":"over"},{"text":{"content":"one","beginOffset":-1},"partOfSpeech":{"tag":"NUM","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":14,"label":"NUMBER"},"lemma":"one"},{"text":{"content":"million","beginOffset":-1},"partOfSpeech":{"tag":"NUM","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"POBJ"},"lemma":"million"},{"text":{"content":",","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"P"},"lemma":","},{"text":{"content":"but","beginOffset":-1},"partOfSpeech":{"tag":"CONJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"CC"},"lemma":"but"},{"text":{"content":"today","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":18,"label":"TMOD"},"lemma":"today"},{"text":{"content":"considered","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"CONJ"},"lemma":"consider"},{"text":{"content":"to","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":21,"label":"AUX"},"lemma":"to"},{"text":{"content":"have","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":21,"label":"AUX"},"lemma":"have"},{"text":{"content":"been","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":18,"label":"XCOMP"},"lemma":"be"},{"text":{"content":"much","beginOffset":-1},"partOfSpeech":{"tag":"ADV","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":23,"label":"ADVMOD"},"lemma":"much"},{"text":{"content":"smaller","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":21,"label":"ACOMP"},"lemma":"small"},{"text":{"content":",","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"P"},"lemma":","},{"text":{"content":"arrived","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":25,"label":"ROOT"},"lemma":"arrive"},{"text":{"content":"at","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":25,"label":"PREP"},"lemma":"at"},{"text":{"content":"the","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":28,"label":"DET"},"lemma":"the"},{"text":{"content":"pass","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":26,"label":"POBJ"},"lemma":"pass"},{"text":{"content":"in","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":25,"label":"PREP"},"lemma":"in"},{"text":{"content":"late","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":31,"label":"AMOD"},"lemma":"late"},{"text":{"content":"August","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":29,"label":"POBJ"},"lemma":"August"},{"text":{"content":"or","beginOffset":-1},"partOfSpeech":{"tag":"CONJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":31,"label":"CC"},"lemma":"or"},{"text":{"content":"early","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":34,"label":"AMOD"},"lemma":"early"},{"text":{"content":"September","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":31,"label":"CONJ"},"lemma":"September"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":25,"label":"P"},"lemma":"."}],"language":"en"},
  {"sentences":[{"text":{"content":"About 150,000 Hydro Ottawa customers alone are without power after a twister ripped through the area and neighbouring Quebec on Friday — and the city's mayor warns it could take days to restore service to those affected by the storm.","beginOffset":-1},"sentiment":null}],"tokens":[{"text":{"content":"About","beginOffset":-1},"partOfSpeech":{"tag":"ADV","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":1,"label":"ADVMOD"},"lemma":"About"},{"text":{"content":"150,000","beginOffset":-1},"partOfSpeech":{"tag":"NUM","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"NUM"},"lemma":"150,000"},{"text":{"content":"Hydro","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":3,"label":"NN"},"lemma":"Hydro"},{"text":{"content":"Ottawa","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"NN"},"lemma":"Ottawa"},{"text":{"content":"customers","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"PLURAL","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"NSUBJ"},"lemma":"customer"},{"text":{"content":"alone","beginOffset":-1},"partOfSpeech":{"tag":"ADV","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"ADVMOD"},"lemma":"alone"},{"text":{"content":"are","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PRESENT","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"ROOT"},"lemma":"be"},{"text":{"content":"without","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"PREP"},"lemma":"without"},{"text":{"content":"power","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":7,"label":"POBJ"},"lemma":"power"},{"text":{"content":"after","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"MARK"},"lemma":"after"},{"text":{"content":"a","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":11,"label":"DET"},"lemma":"a"},{"text":{"content":"twister","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"NSUBJ"},"lemma":"twister"},{"text":{"content":"ripped","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"ADVCL"},"lemma":"rip"},{"text":{"content":"through","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"PREP"},"lemma":"through"},{"text":{"content":"the","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"DET"},"lemma":"the"},{"text":{"content":"area","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":13,"label":"POBJ"},"lemma":"area"},{"text":{"content":"and","beginOffset":-1},"partOfSpeech":{"tag":"CONJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"CC"},"lemma":"and"},{"text":{"content":"neighbouring","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":12,"label":"CONJ"},"lemma":"neighbour"},{"text":{"content":"Quebec","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":17,"label":"DOBJ"},"lemma":"Quebec"},{"text":{"content":"on","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":17,"label":"PREP"},"lemma":"on"},{"text":{"content":"Friday","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":19,"label":"POBJ"},"lemma":"Friday"},{"text":{"content":"—","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"P"},"lemma":"—"},{"text":{"content":"and","beginOffset":-1},"partOfSpeech":{"tag":"CONJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"CC"},"lemma":"and"},{"text":{"content":"the","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":24,"label":"DET"},"lemma":"the"},{"text":{"content":"city","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":26,"label":"POSS"},"lemma":"city"},{"text":{"content":"'s","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":24,"label":"PS"},"lemma":"'s"},{"text":{"content":"mayor","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":27,"label":"NSUBJ"},"lemma":"mayor"},{"text":{"content":"warns","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"CONJ"},"lemma":"warn"},{"text":{"content":"it","beginOffset":-1},"partOfSpeech":{"tag":"PRON","aspect":"ASPECT_UNKNOWN","case":"NOMINATIVE","form":"FORM_UNKNOWN","gender":"NEUTER","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":30,"label":"NSUBJ"},"lemma":"it"},{"text":{"content":"could","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":30,"label":"AUX"},"lemma":"could"},{"text":{"content":"take","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":27,"label":"CCOMP"},"lemma":"take"},{"text":{"content":"days","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"PLURAL","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":30,"label":"TMOD"},"lemma":"day"},{"text":{"content":"to","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":33,"label":"AUX"},"lemma":"to"},{"text":{"content":"restore","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":30,"label":"XCOMP"},"lemma":"restore"},{"text":{"content":"service","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":33,"label":"DOBJ"},"lemma":"service"},{"text":{"content":"to","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":33,"label":"PREP"},"lemma":"to"},{"text":{"content":"those","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"PLURAL","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":35,"label":"POBJ"},"lemma":"those"},{"text":{"content":"affected","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PAST","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":36,"label":"VMOD"},"lemma":"affect"},{"text":{"content":"by","beginOffset":-1},"partOfSpeech":{"tag":"ADP","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":37,"label":"PREP"},"lemma":"by"},{"text":{"content":"the","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":40,"label":"DET"},"lemma":"the"},{"text":{"content":"storm","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":38,"label":"POBJ"},"lemma":"storm"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":6,"label":"P"},"lemma":"."}],"language":"en"},
  {"sentences":[{"text":{"content":"A hammer is a tool.","beginOffset":-1},"sentiment":null},{"text":{"content":"It's time to make supper.","beginOffset":-1},"sentiment":null},{"text":{"content":"The moon is not full yet.","beginOffset":-1},"sentiment":null}],"tokens":[{"text":{"content":"A","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":1,"label":"DET"},"lemma":"A"},{"text":{"content":"hammer","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"NSUBJ"},"lemma":"hammer"},{"text":{"content":"is","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PRESENT","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"ROOT"},"lemma":"be"},{"text":{"content":"a","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":4,"label":"DET"},"lemma":"a"},{"text":{"content":"tool","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"ATTR"},"lemma":"tool"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":2,"label":"P"},"lemma":"."},{"text":{"content":"It","beginOffset":-1},"partOfSpeech":{"tag":"PRON","aspect":"ASPECT_UNKNOWN","case":"NOMINATIVE","form":"FORM_UNKNOWN","gender":"NEUTER","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":7,"label":"NSUBJ"},"lemma":"It"},{"text":{"content":"'s","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PRESENT","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":7,"label":"ROOT"},"lemma":"be"},{"text":{"content":"time","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":7,"label":"ATTR"},"lemma":"time"},{"text":{"content":"to","beginOffset":-1},"partOfSpeech":{"tag":"PRT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":10,"label":"AUX"},"lemma":"to"},{"text":{"content":"make","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":8,"label":"VMOD"},"lemma":"make"},{"text":{"content":"supper","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":10,"label":"DOBJ"},"lemma":"supper"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":7,"label":"P"},"lemma":"."},{"text":{"content":"The","beginOffset":-1},"partOfSpeech":{"tag":"DET","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":14,"label":"DET"},"lemma":"The"},{"text":{"content":"moon","beginOffset":-1},"partOfSpeech":{"tag":"NOUN","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"SINGULAR","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"NSUBJ"},"lemma":"moon"},{"text":{"content":"is","beginOffset":-1},"partOfSpeech":{"tag":"VERB","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"INDICATIVE","number":"SINGULAR","person":"THIRD","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"PRESENT","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"ROOT"},"lemma":"be"},{"text":{"content":"not","beginOffset":-1},"partOfSpeech":{"tag":"ADV","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"NEG"},"lemma":"not"},{"text":{"content":"full","beginOffset":-1},"partOfSpeech":{"tag":"ADJ","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"ACOMP"},"lemma":"full"},{"text":{"content":"yet","beginOffset":-1},"partOfSpeech":{"tag":"ADV","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"ADVMOD"},"lemma":"yet"},{"text":{"content":".","beginOffset":-1},"partOfSpeech":{"tag":"PUNCT","aspect":"ASPECT_UNKNOWN","case":"CASE_UNKNOWN","form":"FORM_UNKNOWN","gender":"GENDER_UNKNOWN","mood":"MOOD_UNKNOWN","number":"NUMBER_UNKNOWN","person":"PERSON_UNKNOWN","proper":"PROPER_UNKNOWN","reciprocity":"RECIPROCITY_UNKNOWN","tense":"TENSE_UNKNOWN","voice":"VOICE_UNKNOWN"},"dependencyEdge":{"headTokenIndex":15,"label":"P"},"lemma":"."}],"language":"en"},
];

treeChalk(exampleSentence[4].tokens, {mobileLayout: true});
