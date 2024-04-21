function toggleMenu() {
    let sidenav = document.getElementById("mySidenav");
    sidenav.classList.toggle("active");
    if (document.querySelector('.mobile-buttons')) {
        document.querySelector('.mobile-buttons').classList.toggle('active');
    }
}

function toggleFilter() {
    let mobileMenu = document.querySelector(".browse-container");
    let mobileFilters = document.querySelector(".browse-filters");
    document.querySelector('.mobile-buttons').classList.toggle('active');
    document.body.classList.toggle('body-no-scroll');
    mobileMenu.classList.toggle("active");
    mobileFilters.classList.toggle("active");
}