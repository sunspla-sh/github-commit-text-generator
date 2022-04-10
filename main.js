import './style.scss'

const loadingElement = document.querySelector('.loading');

function loadingEllipsis(){
  
  if(loadingElement.textContent === 'Loading...'){
    loadingElement.textContent = 'Loading';
  } else {
    loadingElement.textContent += '.';
  }
}

const loadingIntervalId = setInterval(loadingEllipsis, 333);



window.onload = function (){

  //hide loading indicator
  document.querySelector('.loading').classList.add('hidden');

  //clear loading interval
  clearInterval(loadingIntervalId)

  //show loaded page
  document.querySelector('.loaded').style.display = 'block';

  let selectedYear = (new Date()).getFullYear()

  //create empty array
  const myGithubCommitArray = [];

  //make array two-dimensional and set all values to zero
  for(let x = 0; x < 50; x++){
    myGithubCommitArray[x] = [];
    for(let y = 0; y < 7; y++){
      myGithubCommitArray[x][y] = false;
    }
  }

  document.querySelector('.bob-link').addEventListener('mouseover', () => {
    document.body.style.overflow = 'hidden';
  });

  document.querySelector('.bob-link').addEventListener('mouseleave', () => {
    document.body.style.overflow = 'visible';
  })

  document.querySelector('#app').innerHTML = generateDivGridFrom2DArray(myGithubCommitArray);

  document.querySelector('#starting p:last-of-type').textContent =  getFirstSundayOfYear(selectedYear).toDateString();

  //find the current year and set our default selected option to 
  [...document.querySelector('#years').children].find(element => Number(element.value) === selectedYear).setAttribute('selected', true);

  //add onchange event to our year Select HTML element
  document.querySelector('#years').onchange = e => {

    //update selectedYear
    selectedYear = e.currentTarget.value;

    //update starting date text
    document.querySelector('#starting p:last-of-type').textContent =  getFirstSundayOfYear(selectedYear).toDateString();
    
    //regenerate tooltips with new dates from new selectedYear
    [...document.querySelectorAll('.box')].forEach(element => {
      element.dataset.originalTitle = calculateDateInDiv(Number(element.dataset.x), Number(element.dataset.y));
    });

    //regenerate new git commit script with new dates from new selectedYear
    console.log('recalculate git commit script for new year');
    generateBashScript();
    
  }

  //add onchange event to our commit-depth input HTML element
  document.querySelector('#commit-depth').onchange = () => {
    console.log('recalculate git commit script for new depth');
    generateBashScript();
  }

  //activate all tooltips when our page loads
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });

  //add onclick event to our copy-to-clipboard svg
  document.querySelector('#copy').onclick = () => {
    navigator.clipboard.writeText(document.querySelector('#git').textContent)
      .then(resolve => console.log('copy to clipboard status', resolve), reject => console.log('copy to clipboard reject', reject));
    let banner = document.createElement('p');
    banner.classList.add('banner');
    banner.textContent = 'Copied!';
    document.querySelector('pre').appendChild(banner);
    setTimeout(() => {
      document.querySelector('.banner').remove();
    }, 1000);
  };

  //generate divs using our two-dimensional array values
  function generateDivGridFrom2DArray(twoDimensionalArray){
    let weeklyHTML = '';
    for(let i = 0; i < twoDimensionalArray.length; i++){
      let sevenDaysHTML = '';
      for(let j = 0; j < twoDimensionalArray[i].length; j++){
        sevenDaysHTML += `<div class="box" data-x="${i}" data-y="${j}" data-toggle="tooltip" data-placement="top" title="${calculateDateInDiv(i, j)}"></div>`
      }
      weeklyHTML += `<div>${sevenDaysHTML}</div>`
    }
    return `<div class="commit-container">${weeklyHTML}</div>`;
  }



  for(let box of document.querySelectorAll('.box')) {
    box.addEventListener('click', e => {

      let x = Number(e.currentTarget.dataset.x);
      let y = Number(e.currentTarget.dataset.y)
      if(e.currentTarget.style.backgroundColor != 'green'){
        e.currentTarget.style.backgroundColor = 'green';
        myGithubCommitArray[x][y] = true;
      } else {
        e.currentTarget.style.backgroundColor = 'white';
        myGithubCommitArray[x][y] = false;
      }    

      generateBashScript();

    });
  }

  function getFirstSundayOfYear(chosenYear){
    const tempDate = new Date();
    tempDate.setHours(0,0,0,0);
    tempDate.setFullYear(chosenYear, 0 ,1);
    const day = tempDate.getDay();
    const daysUntilNextSunday = day !== 0 ? 7 - day : 0;
    tempDate.setDate(tempDate.getDate() + daysUntilNextSunday);
    return tempDate; 
  }

  function calculateDateInDiv(weeks, days){
    let dateInDiv = getFirstSundayOfYear(selectedYear);
    dateInDiv.setDate(dateInDiv.getDate() + 7 * weeks + days);
    return dateInDiv.toDateString()
  }

  function calculateDateInISO(weeks, days){
    let dateInDiv = getFirstSundayOfYear(selectedYear);
    dateInDiv.setDate(dateInDiv.getDate() + 7 * weeks + days);
    return dateInDiv.toISOString();
  }

  function generateGitCommits(){
    //generate new array of commits
    let commitDates = myGithubCommitArray.map(arr => arr.slice());
    for(let x = 0; x < commitDates.length; x++){
      for(let y = 0; y < commitDates[x].length; y++){
        if(commitDates[x][y]){
          commitDates[x][y] = calculateDateInISO(x, y);
        }
      }
    }
    return commitDates;
  }

  function generateBashScript(){
    document.querySelector('#git').replaceChildren();
    let commitDepth = document.querySelector('#commit-depth').value;
    let dateBashArray = 'dateArray=(';
    generateGitCommits().forEach(week => {
      week.forEach(day => {
        if(day){
          for(let count = 0; count < commitDepth; count++) dateBashArray += `"${day}" `;
        }
      });
    });
    dateBashArray = dateBashArray.trim() + ')';

    const bashScript = `
      git init
      touch readme.md
      echo "this script was created by gitboxdraw.com" >> readme.md
      ${dateBashArray}
      for date in \${dateArray[@]}; do
        echo "\${date}" >> readme.md
        git add .
        git commit -m "daily commit \${date}" --date "\${date}"
      done
    `;
    console.log(bashScript);

    let bashScriptTag = document.createElement('p');
    bashScriptTag.textContent = bashScript;
    if(!dateBashArray.includes('()')){
      document.querySelector('pre').classList.remove('hidden');
      document.querySelector('#copy').classList.remove('hidden');
      document.querySelector('#git').appendChild(bashScriptTag)
      hljs.highlightAll();
    } else {
      document.querySelector('#git').classList.remove('hljs');
      document.querySelector('#git').classList.remove('language-bash');
      document.querySelector('pre').classList.add('hidden');
      document.querySelector('#copy').classList.add('hidden');
      
    }
  }

}




/*

github box colors
grey - #ebedf0 - 0 contributions
lightest green - #9be9a8 - bottom 25%
lighter green - 40c463 - mid bottom 25%
light green - #30a14e - mid top 25%
dark green - #216e39 - top 25%

//DOES NOT REQUIRE LOGIN
https://github.com/users/sunspla-sh/contributions?to=2017-12-31

*/