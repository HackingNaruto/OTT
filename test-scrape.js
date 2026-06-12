const cheerio = require('cheerio');
fetch('https://www.themoviedb.org/search?query=Breaking+Bad', {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'}})
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());
    const firstImg = $('img.poster').first().attr('src');
    console.log('First poster:', firstImg);
  });
