# treeChalk

Write out branches of a tree (e.g., for syntactically parsed text) in increasing levels of detail. The expected input is a JSON file from the Google NLP API.

Sample input / output:

```
{
  "sentences": [
    {
      "text": {
        "content": "Cuttlefish have not one, not two, but three hearts!",
        "beginOffset": -1
      },
      "sentiment": null
    }
  ],
  "tokens": [
    {
      "text": {
        "content": "Cuttlefish",
        "beginOffset": -1
      },
      "partOfSpeech": {
        "tag": "NOUN",
        ...
}
```

From this, we get:

`> node treeChalk.js cuttlefish.txt`

![colourful tree structure of cuttlefish sentence](https://github.com/TheophileMot/treeChalk/blob/master/cuttlefish.png)
