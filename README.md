<!-- Make sure you edit doc/README.hbs rather than README.md because the latter is auto-generated -->

github-card
===========

> Node module that allows you to generate SVG cards for GitHub Repositories and Gists.

Installation
------------

Install `github-card` by running:

```sh
$ npm install --save https://github.com/MeowSky49887/Github-Card.git
```

Documentation
-------------

**Example**

```js
const { generateRepoCard, generateGistCard } = require("github-card");

(async () => {
    // Generate Repository Card
    const repoCard = await generateRepoCard("VOICEVOX/voicevox");
    console.log(repoCard);

    // Generate Gist Card
    const gistCard = await generateGistCard("3b0f206927c5fe8fd9b5c3cd830d500f");
    console.log(gistCard);
})();
```
