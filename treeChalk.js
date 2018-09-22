const chalk = require('chalk');

function centre(str, len) {
  let excess = Math.max(0, len - str.length);
  return ' '.repeat(excess >> 1) + str + ' '.repeat((excess + 1) >> 1);
}

function makeTree(tokenDependencyArray) {
  let tree = [];
  tree.depth = 0;

  function getNode(i) {
    if (tree[i] === undefined) {
      let head = tokenDependencyArray[i].dependencyEdge.headTokenIndex;
      if (head === i) {
        tree[i] = {
          parent: undefined,
          level: 0,
          children: [],
        };
        tree.root = i;
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

  makeColour(tree.root, [120, 100, 100], 360);
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
];

treeChalk(exampleSentence[2].tokens, {mobileLayout: true});
