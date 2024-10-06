// Fetch data from the <url>
async function fetchData(url) {
    try {
        let response = await fetch(url);

        if (!response.ok) {
            throw 'Error, check the data. Something went wrong.';
        }

        let data = await response.json();

        return data;

    } catch (error) {
        console.warn(error);
    }
}

// Categorize the filtered data
async function categorizeData(url, percentage) {
    try {
        let data = await fetchData(url);

        // Categories
        const categories = data["cats"];
        // Data objects
        const OrigData = data["data"];
        const origDataAsArray = Object.entries(OrigData);
        // Filtering
        const filteredArray = origDataAsArray.filter(([key, value]) => value.usage_perc_y >= percentage);
        const filteredData = Object.fromEntries(filteredArray);

        // Categorized data initialize
        let categorizedData = {};

        Object.keys(categories).forEach(catKey => {
            categorizedData[catKey] = {};

            // Get the list of category strings for the current catKey (e.g. "CSS" -> ["CSS", "CSS2", "CSS3"])
            let categoryStrings = categories[catKey];

            Object.keys(filteredData).forEach(featureKey => {
                let feature = filteredData[featureKey];

                // Check if any of the feature's categories match the current category strings
                // If a match is found, add this feature to the current category
                let matchesCategory = feature.categories.some(cat => categoryStrings.includes(cat));
                if (matchesCategory) {
                    categorizedData[catKey][featureKey] = feature;
                }
            });
        });

        return (categorizedData);
    } catch (error) {
        console.warn(error);
    }
}

// Get <x> random elements from <obj> Object and store in an array.
// Use <categories> if not null to filter the matching data.
function randomFeatures(obj, x, categories = null) {
    let resultArr = [];
    // Append selected category data
    if (categories) {
        let categObject = {};
        Object.keys(obj).forEach((cat) => {
            if (categories.includes(cat)) {
                categObject = {
                    ...categObject,
                    ...obj[cat],
                };
            }
        })
        obj = categObject;
    }

    // Select <x> object to an array with the keys as "key" property
    while (resultArr.length < x) {
        let randomFeatureKey = Object.keys(obj)[Object.keys(obj).length * Math.random() << 0];
        if (!resultArr.includes(randomFeatureKey)) {
            let randomFeature = {
                key: randomFeatureKey,
                ...obj[randomFeatureKey]
            };
            resultArr.push(randomFeature);

        }
    }

    return resultArr;
}

// Main function to fetch the data and get the random feature ideas
async function getCategoryRandomFeatures(category = null, numFeatures = 5) {
    let fetch = await categorizeData("https://raw.githubusercontent.com/Fyrd/caniuse/refs/heads/main/fulldata-json/data-2.0.json", 95.0);

    let result = randomFeatures(fetch, numFeatures, category);

    return result;
}


// HTML DOM manipulation
let ideaform = document.querySelector(".form-container form");
let featureNum = document.getElementById("numFeatures");
let checkboxValues = document.getElementsByName("category");
let outputDiv = document.getElementById("output");
let ideasHeading = document.getElementById("ideas-heading");
let themeSwitcher = document.querySelector(".theme-switcher input");

// Theme switcher event listener
themeSwitcher.addEventListener("change", (e) => {
    if (e.target.checked) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
});

// Form event listener
ideaform.addEventListener("submit", async (e) => {
    // Prevent default: do not reload the page
    e.preventDefault();

    let categories = [];

    // Iterate the category checkboxes
    checkboxValues.forEach((cat) => {
        cat.checked ? categories.push(cat.value) : null;
    })

    // Sanitize numeric input
    let numericValue = parseInt(featureNum.value);
    if (isNaN(numericValue) || numericValue < 1) {
        alert("Please select a positive integer!");
        return false;
    }

    // Display the title
    ideasHeading.style.display = "block";

    // Call our main function
    let result = await getCategoryRandomFeatures(category = categories, numFeatures = numericValue);

    // Clear the output div
    outputDiv.innerHTML = ``;

    result.forEach((obj => {
        // Spread the "categories" array for more control over output
        let categoryOutput = "";
        obj["categories"].forEach((cat) => {
            categoryOutput += `<span class="idea-category u-rounded u-inside-padding u-bg-primary u-text-dark">${cat}</span>`
        });

        // Populate output with template literal HTML
        outputDiv.innerHTML += `
            <article class="idea u-large-rounded u-padding u-flex u-flex-column u-flex-wrap">
                <a target="_blank" href="https://caniuse.com/${obj["key"]}" class="idea-title u-text-light" 
                aria-label="Web Feature: ${obj["key"]}, with ${obj["usage_perc_y"]} % 
                browser support and categorized under ${(obj["categories"]).join(" and ")}.">${obj["key"]}</a>
                <span class="idea-percent u-rounded u-inside-padding u-bg-light u-text-light">${obj["usage_perc_y"]} %</span>
                <div class="idea-categories u-flex u-flex-wrap">${categoryOutput}</div>
            </article>
        `
    }))

}, false
);