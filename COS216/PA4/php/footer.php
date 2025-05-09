<?php
// Footer.php for all pages
?>

<link rel="stylesheet" href="../css/footer.css">
<link rel="stylesheet" href="../css/theme.css">
<script src="../js/theme.js" defer></script>

<!-- Footer -->
<footer>
    <h3>Find us on</h3>
    <a href="../../../under_con.html">www.shopezeonline.com</a>
    <br>

    <div class="socials">
        <a href="../../../under_con.html"><i class="fab fa-twitter"></i></a>
        <a href="../../../under_con.html"><i class="fab fa-youtube"></i></a>
        <a href="../../../under_con.html"><i class="fab fa-facebook"></i></a>
        <a href="../../../under_con.html"><i class="fab fa-pinterest"></i></a>
    </div>

    <h3>More about us here:</h3>
    <a href="about.php">ABOUT US</a>
    <br><br>

    <!-- Theme Toggle -->
    <div class="theme-selector">
        <button class="theme-toggle" data-theme="light">Light Theme</button>
        <button class="theme-toggle" data-theme="dark">Dark Theme</button>
    </div>
    <br>

    © ShopEze Online (Pty) Ltd <br> (All Rights Reserved)
    <br><br>
</footer>

<!-- Loader Script -->
<script>
    window.addEventListener("load", function () {
        document.getElementById("loader-container").style.display = "none";
        document.getElementById("content").style.display = "block";
    });
</script>

<!-- Dropdown Menu Script -->
<script>
    document.querySelectorAll(".dropdown-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const content = button.nextElementSibling;
            content.style.display =
                content.style.display === "block" ? "none" : "block";
        });
    });
</script>