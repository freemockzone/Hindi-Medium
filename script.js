document.addEventListener("DOMContentLoaded", () => {
  const topNewsContainer = document.getElementById("top-news");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const subjectLinks = document.querySelectorAll(".subject-filter-link");
  const mainUpdatesSection = document.getElementById("daily-updates");
  const searchInput = document.getElementById("search-input");
  const menuToggle = document.getElementById("menu-toggle");
  const mainNavBar = document.getElementById("main-nav-bar");
  const navLinks = document.querySelectorAll("#main-nav-bar a");
  const stateLinks = document.querySelectorAll(".state-link"); // नया राज्य लिंक सेलेक्टर

  let allNewsData = [];

  // --- HELPER FUNCTIONS ---

  // 1. HTML बनाने के लिए फ़ंक्शन (संशोधित)
  const createNewsCardHTML = (news) => {
    // राज्य का लिंक केवल तभी बनाएँ जब state_name मौजूद हो
    let stateLinkHTML = "";
    if (news.state_name && news.state_name.trim() !== "") {
      // लिंक को State News सेक्शन पर स्क्रॉल करने के लिए ID 'state-news-links' का उपयोग करें
      stateLinkHTML = ` | <a href="#state-news-links" class="state-anchor-link" data-state-name="${news.state_name}">राज्य: ${news.state_name}</a>`;
    }

    return `
            <article class="news-card" data-subject="${news.subject_key}">
                <h4>${news.title}</h4>
                <p class="source-tag">स्रोत: ${news.source} | <span class="subject-tag">${news.subject_hindi}</span>${stateLinkHTML}</p>
                <p>${news.summary}</p>
                <a href="${news.link}">संपूर्ण विश्लेषण पढ़ें</a>
            </article>
        `;
  };

  // 2. टैब को सक्रिय करने के लिए फ़ंक्शन
  const activateTab = (targetId) => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    const targetButton = document.querySelector(
      `.tab-button[data-tab="${targetId}"]`
    );
    if (targetButton) targetButton.classList.add("active");

    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add("active");
  };

  // 3. न्यूज़ कार्ड्स को फ़िल्टर करने और दिखाने के लिए फ़ंक्शन
  const renderNews = (filterSubject = "All", filterState = "All") => {
    topNewsContainer.innerHTML = "";

    const filteredNews = allNewsData.filter((news) => {
      const subjectMatch =
        filterSubject === "All" || news.subject_key === filterSubject;
      const stateMatch =
        filterState === "All" || news.state_name === filterState;
      return subjectMatch && stateMatch;
    });

    if (filteredNews.length === 0) {
      topNewsContainer.innerHTML =
        '<p style="padding: 1rem; color: #e74c3c;">इस फ़िल्टर संयोजन से संबंधित कोई समाचार उपलब्ध नहीं है। कृपया फ़िल्टर बदलें।</p>';
    } else {
      filteredNews.forEach((news) => {
        topNewsContainer.innerHTML += createNewsCardHTML(news);
      });
    }
  };

  // 4. ScrollSpy लॉजिक
  const handleScrollSpy = () => {
    let currentSection = "daily-updates";
    const scrollPosition = window.scrollY + 150;

    navLinks.forEach((link) => {
      const targetId = link.getAttribute("data-section");
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        if (targetElement.offsetTop <= scrollPosition) {
          currentSection = targetId;
        }
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === currentSection) {
        link.classList.add("active");
      }
    });
  };

  // --- INITIAL DATA LOAD & EVENT LISTENERS ---

  // JSON डेटा लोड करें
  fetch("data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      allNewsData = data.top_news;
      renderNews("All", "All");
    })
    .catch((error) => {
      console.error("Error loading news data:", error);
      topNewsContainer.innerHTML =
        '<p style="padding: 1rem; color: #e74c3c;">क्षमा करें, समाचार लोड नहीं हो सका। कृपया अपनी ' +
        "**data.json** फ़ाइल की जाँच करें।</p>";
    });

  // टैब बटन पर क्लिक लिसनर
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      activateTab(targetTab);
    });
  });

  // विषय-संबंधी लिंक पर क्लिक लिसनर (विषय फ़िल्टरिंग)
  subjectLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab("top-news");
      const targetSubject = e.target.getAttribute("data-subject");
      // केवल विषय द्वारा फ़िल्टर करें, राज्य फ़िल्टर को 'All' पर रखें
      renderNews(targetSubject, "All");

      if (mainUpdatesSection) {
        mainUpdatesSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // राज्य-विशिष्ट लिंक पर क्लिक लिसनर (साइडबार से) - (नया)
  stateLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetState = e.target.getAttribute("data-state");

      // "प्रमुख समाचार" टैब को सक्रिय करें
      activateTab("top-news");

      // केवल राज्य द्वारा फ़िल्टर करें, विषय फ़िल्टर को 'All' पर रखें
      renderNews("All", targetState);

      // सेक्शन पर स्क्रॉल करें
      if (mainUpdatesSection) {
        mainUpdatesSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // --- SEARCH FUNCTIONALITY ---
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (searchTerm === "") {
        renderNews("All", "All");
        return;
      }

      const searchResults = allNewsData.filter((news) => {
        const searchString =
          `${news.title} ${news.summary} ${news.source} ${news.subject_hindi} ${news.state_name}`.toLowerCase();
        return searchString.includes(searchTerm);
      });

      activateTab("top-news");
      topNewsContainer.innerHTML = "";

      if (searchResults.length === 0) {
        topNewsContainer.innerHTML = `<p style="padding: 1rem; color: #e74c3c;">**'${searchTerm}'** से संबंधित कोई परिणाम नहीं मिला।</p>`;
      } else {
        searchResults.forEach((news) => {
          topNewsContainer.innerHTML += createNewsCardHTML(news);
        });
      }
    });
  }

  // --- State Link Click from News Card (नया) ---
  // यह फ़ंक्शन dynamically created news card links के लिए है
  topNewsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("state-anchor-link")) {
      e.preventDefault();
      const targetState = e.target.getAttribute("data-state-name");

      // साइडबार में संबंधित लिंक को हाइलाइट करें (वैकल्पिक)
      stateLinks.forEach((link) => {
        link.classList.remove("active-state");
        if (link.getAttribute("data-state") === targetState) {
          link.classList.add("active-state");
        }
      });

      // "प्रमुख समाचार" टैब को सक्रिय करें और फ़िल्टर लागू करें
      activateTab("top-news");
      renderNews("All", targetState);

      // सेक्शन पर स्क्रॉल करें
      const stateNewsWidget = document
        .getElementById("state-news-links")
        .closest(".sidebar-widget");
      if (stateNewsWidget) {
        stateNewsWidget.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  // --- UI/UX Enhancements ---

  // हैमबर्गर मेनू टॉगल
  if (menuToggle && mainNavBar) {
    menuToggle.addEventListener("click", () => {
      mainNavBar.classList.toggle("active");
    });

    // मेनू खुलने पर लिंक पर क्लिक करने पर मेनू बंद करें
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          mainNavBar.classList.remove("active");
        }
      });
    });
  }

  // ScrollSpy इवेंट
  window.addEventListener("scroll", handleScrollSpy);
  handleScrollSpy();

  // --- FRONTEND SUBSCRIBE FUNCTIONS ---
  const footerSubscribeForm = document.getElementById("footer-subscribe-form");

  if (footerSubscribeForm) {
    footerSubscribeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("धन्यवाद! सदस्यता अनुरोध सफलतापूर्वक भेजा गया।");
      footerSubscribeForm.reset();
    });
  }
});
