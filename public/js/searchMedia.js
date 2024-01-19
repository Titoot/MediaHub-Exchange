$('.search-type-button').on('click', function () {
    const progressBar = $(".indeterminate-progress-bar").show();
    const fileTitle = $(".newfile-form input#filename").val();
    const fileType = $('.newfile-form select#type').find(":selected").val();
 
    $('.search-menu .list li:not(:first-child)').remove();
 
        fetch('/mediaSearch', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ searchQuery: fileTitle, fileType: fileType }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                displayError(data.message);
                return;
            }
 
            data.results.forEach((result) => {
                let itemHTML = `
                   <li class="list-item">
                       <div class="image-container" style="background-image: url('${result.image}')"></div>
                       <div class="media-details">
                           <span class="media-title">${result.name}</span>
                           <span class="media-description">${result.release}</span>
                           <span class="media-id" hidden>${result.mediaId}</span>
                       </div>
                   </li>
                `;
                $('.search-menu .list').append(itemHTML);
            });
            $('.search-menu').slideToggle()
            progressBar.hide();
        })
        .catch((error) => {
            displayError(error);
        });
 });
 
function displayError(error) {
    const errorMessage = $(".newfile-form .error-message");
    errorMessage.text(`An error occurred during fetching media data. Error: ${error}`);
    errorMessage.slideToggle();
    console.error("Error during fetching media data:", error);
}

$(".newfile-form .list").on("click", ".list-item", function(){
    const mediaTitle = $(this).find(".media-title").text();
    const mediaDescription = $(this).find(".media-description").text();

    if(mediaTitle === "None"){
      $(".newfile-form input#filename").attr('placeholder', 'please add the file name');
      $('.search-menu').slideToggle();
      return;
    }
    const mediaId = $(this).find(".media-id").text();
    $(".newfile-form .selected-media-id").text(mediaId);
    $(".newfile-form input#filename").val(mediaTitle);
    $('.search-menu').slideToggle();


});

$(document).mouseup(function(e) {
    var container = $(".search-menu");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) 
    {
        container.slideUp();
    }
});
