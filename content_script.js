function createPopup(jsonData) {
  const popupHTML = `
    <div id="lm-popup" class="lm-popup" style="display: none;">
      <div class="lm-popup-header">
        <h3 class="lm-popup-title"></h3>
        <span class="lm-popup-close">&times;</span>
      </div>
      <div class="lm-popup-content">
        <p class="lm-popup-summary"></p>
        <div class="lm-popup-rating">
          <div class="lm-popup-stars"></div>
          <p class="lm-popup-rating-detail"></p>
        </div>
      </div>
    </div>
  `;

  const popupContainer = document.createElement("div");
  popupContainer.innerHTML = popupHTML.trim();
  document.body.appendChild(popupContainer.firstChild);

  const popup = document.getElementById("lm-popup");
  const title = popup.querySelector(".lm-popup-title");
  const summary = popup.querySelector(".lm-popup-summary");
  const ratingStars = popup.querySelector(".lm-popup-stars");
  const ratingDetail = popup.querySelector(".lm-popup-rating-detail");

  title.textContent = jsonData.title;
  summary.textContent = jsonData.content;

  ratingStars.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const star = document.createElement("span");
    star.innerHTML = "&bigstar;";
    star.classList.add("lm-popup-star");
    if (i < jsonData.BEWERTUNG) {
      star.classList.add("filled");
    }
    ratingStars.appendChild(star);
  }

  ratingDetail.textContent = jsonData.BEWERTUNGSDETAILS;

  const closeBtn = popup.querySelector(".lm-popup-close");
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  popup.style.display = "block";
}

function sendToLLM(cleanContent) {
  let systemPrompt = `
     Du bist ein hilfreicher Assistent und bekommst von einem Browser-Plugin ein bereinigtes HTML, das nur noch den eigentlichen Inhalt in Textform beinhaltet. 
	 
	 Hier der Aufbau deiner Antwort im JSON Format:
     \`\`\`json
     {{
		 "title" : TITEL_DEINER_ZUSAMMENFASSUNG,
		 "content" : DEINE_KURZE_ZUSAMMENFASSUNG,
		 "BEWERTUNG" : 1_BIS_5_5_IST_AM_BESTEN_ALS_INT,
		 "BEWERTUNGSDETAILS" : ERLÄUTERUNG_DEINER_BEWERTUNG
     }}\`\`\`
	 
	 Als Bewertung gib bitte deine eigene Bewertung ab. Bewerte dabei Inhalt, Neutralität, Mehrwert und Echtheit der Information. 
	 Wenn du dir bei der Echtheit nicht sicher bist, bewerte den Inhalt Schritt für Schritt mit dir zur Verfügung stehenden
	 Informationen und errechne dir einen Echtheitsscore. Ist dieser hoch, ist alles gut, sonst geh von Fakenews aus.
	 Bewerte Fakenews und Clickbait immer sehr schlecht! Bewahre damit den User davor, seine Zeit zu verschwenden.
	 Bewertung von 1 ist sehr schlecht, Bewertung von 5 heißt sehr gut. 
	 In BEWERTUNGSDETAILS erkläre deine Bewertung kurz. Erläutere auf JEDEN FALL warum du Punkte abgezogen hast.
	
	 Es ist sehr wichtig, dass du ausschließlich mit dem JSON im bereits erwähnten Format antwortest! 
	 Füge unter keinen Umständen weitere Informationen deiner Antwort hinzu! Kontrolliere deine Antwort vor dem absenden, ob sie dem Format entspricht.
	 `;

  systemPrompt = systemPrompt.trim();

  console.log("clean: " + cleanContent.length);

  const requestMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: cleanContent },
  ];

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stream: false,
      messages: requestMessages,
      temperature: 0.15,
      model: "mistral",
    }),
  };

  fetch("http://localhost:11434/api/chat", requestOptions)
    .then((response) => {
      if (response.ok && response.status === 200) {
        return response.json();
      } else {
        alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        throw new Error("Network response was not ok.");
      }
    })
    .then((data) => {
      console.log(data);
      const jsonData = JSON.parse(data.message.content);
      createPopup(jsonData);
    })
    .catch((error) => console.error(error));
}

function removeMultipleSpaces(str) {
  // Replace multiple spaces with single space
  return str
    .trim()
    .split(/[\s,\t,\n]+/)
    .join(" ");
}

function removeAllTags(bodyClone) {
  const tagsToRemove = ["script", "style"];

  tagsToRemove.forEach(function (tag) {
    const elements = bodyClone.getElementsByTagName(tag);
    Array.from(elements).forEach(function (element) {
      element.parentNode.removeChild(element);
    });
  });

  return removeMultipleSpaces(bodyClone.textContent.trim());
}

function getCleanContent() {
  let documentClone = document.cloneNode(true);
  let bodyClone = documentClone.body.cloneNode(true);

  let plainText = removeAllTags(bodyClone);
  console.dir(plainText);
  sendToLLM(plainText);
}

getCleanContent();
