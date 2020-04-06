let JobList = require('./JobList.json');
const fs = require('fs');
const puppeteer = require('puppeteer');

function extractItems() {
  const extractedElements = document.querySelectorAll('div.wd-ViewPage')
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
      items = await page.evaluate(() => {
        let job = [];
        // get the hotel elements
        const jobDetail = {};
        let jobElement = document.querySelectorAll('div.wd-ViewPage');
        // get the hotel data
        jobElement.forEach((jobElement) => {
          try {
            jobDetail.jobTitle = jobElement.querySelector('div.GWTCKEditor-Disabled').innerText;
            // let reqNum = jobElement.querySelectorAll('div.WO3O > div').innerText;
            jobDetail.companyDetail = jobElement.querySelector('div.GWTCKEditor-Disabled > p ').innerText;

            if (jobElement.querySelector('div.GWTCKEditor-Disabled > ul')) {
              let a = jobElement.querySelector('div.GWTCKEditor-Disabled > ul').innerText;
              let b = a.split("\n")
              jobDetail.responsibilities = b
            }
          }
          catch (exception) {
          }
          job.push(jobDetail);
        });
        return job;
      });

      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch (e) { }
  return items;
}


// async function scrapeInfiniteScrollItems(
//   page,
//   extractItems,
//   itemTargetCount,
//   scrollDelay = 1000,
// ) {
//   let items = [];
//   // let test = [];
//   try {
//     let previousHeight;
//     while (items.length < itemTargetCount) {
//       items = await page.evaluate(extractItems);

//       // var finalData = await items.map(i => {
//       //   let tmp = i.split(/\r\n|\r|\n/)[0].trim();  //Job Title
//       //   return tmp
//       // })
//       // console.log(items)
//       // test.push(finalData)
//       var jobTitle = items[0]; //job title
//       var jobDescription = items[1]; //job detail
//       var companyDetail = items[2]; //Company Detail
//       previousHeight = await page.evaluate('document.body.scrollHeight');
//       await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
//       await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
//       await page.waitFor(scrollDelay);
//     }
//   } catch (e) { }
//   return { jobTitle: jobTitle, jobDescription: jobDescription, companyDetail: companyDetail };
// }




(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  let items;
  let job = []
  for (let i = 0; i < 3; i++) {
    const url = JobList[i].url;
    await page.goto(`${url}`, { waitUntil: 'domcontentloaded' });
    // Scroll and extract items from the page.
    items = await scrapeInfiniteScrollItems(page, extractItems, 120);
    job.push(items);
    // console.log(job)
  }
  // Save extracted items to a file.
  fs.writeFile('scraperData.json', JSON.stringify(job), function (err) {
    if (err) throw err;
    console.log('complete');
  })

  // Close the browser.
  await browser.close();
})();
