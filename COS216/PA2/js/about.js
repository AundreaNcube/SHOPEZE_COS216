document.addEventListener("DOMContentLoaded", function () {
    var faqQuestions = document.querySelectorAll(".faq-question");
    
    for (var i = 0; i < faqQuestions.length; i++) {
        faqQuestions[i].addEventListener("click", function () {
            var answer = this.nextElementSibling;
            var icon = this.querySelector("span");
            var currentDisplay = window.getComputedStyle(answer).display;

            if (currentDisplay === "none") {
                answer.style.display = "block";
                icon.textContent = "-";
            } else {
                answer.style.display = "none";
                icon.textContent = "+";
            }
        });
    }
});