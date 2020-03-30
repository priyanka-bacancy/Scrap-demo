let JobList = require('./JobList.json');
const fs = require('fs');
const puppeteer = require('puppeteer');

function extractItems() {
  const extractedElements = document.querySelectorAll('div.GWTCKEditor-Disabled')
  const items = [];
  for (let element of extractedElements) {
    items.push(element.innerText);
  }
  return items;
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      var finaData = await items.map(i => {
        console.log(i)
      })
      var jobTitle = items[0]; //job title
      var jobDescription = items[1]; //job detail
      var companyDetail = items[2]; //Company Detail
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch (e) { }
  return { jobTitle: jobTitle, jobDescription: jobDescription, companyDetail: companyDetail };
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  let items;
  for (let i = 0; i < 3; i++) {
    const url = JobList[i].url;
    await page.goto(`${url}`, { waitUntil: 'domcontentloaded' });
    // Scroll and extract items from the page.
    items = await scrapeInfiniteScrollItems(page, extractItems, 120);
  }

  // Save extracted items to a file.
  fs.writeFile('scraperData.json', JSON.stringify(items), function (err) {
    if (err) throw err;
    console.log('complete');
  })

  // Close the browser.
  await browser.close();
})();
