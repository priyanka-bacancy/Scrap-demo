const fs = require('fs');
const puppeteer = require('puppeteer');

function extractItems() {
  const extractedElements = document.querySelectorAll('div.WP0F')
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
    let detailPageUrl = [];
    let reqNum;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);

      var jobDetailObj = await items.map(i => {
        let jobTitle = i.split(/\r\n|\r|\n/)[0].trim();  //Job Title
        let jobTitleUrl = jobTitle.replace(/[ ,()/&]/g, '-')

        reqNum = (i.split(/\r\n|\r|\n/)[1]).split(' ')[0];

        let location = (i.split('|')[1]).trim();  //Job Location
        let filteredLocation = (location.replace(', More...', '')).replace(', ', '-');
        let locationUrl = filteredLocation.replace(' ', '-')

        let postedDate = (i.split('|')[2]).trim();
        detailPageUrl = `https://cartech.wd5.myworkdayjobs.com/en-US/CTCExternal/job/${locationUrl}/${jobTitleUrl}_${reqNum}`
        return { 'reqNum': reqNum, 'location': location, 'title': jobTitle, 'url': detailPageUrl,'postedDate': postedDate }
      })
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch (e) { }
  return jobDetailObj;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    // headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  // Navigate to the Job list page.
  await page.goto('https://cartech.wd5.myworkdayjobs.com/CTCExternal');

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, 120);

  // Save extracted items to a file.
  fs.writeFile('JobList.json', JSON.stringify(items), function (err) {
    if (err) throw err;
    console.log('complete');
  })

  // Close the browser.
  await browser.close();
})();
