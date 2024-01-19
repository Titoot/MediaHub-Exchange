let newfileForm = $(".newfile-form");
    newfileForm.on("submit", (e) => {
        e.preventDefault();
        const filename = $(".newfile-form input#filename").val();
        const size = $(".newfile-form input#size").val();
        const mediaId =  $(".newfile-form .selected-media-id").text();
        const IsNone = mediaId === "";
        const fileType = IsNone ? "None" : $('.newfile-form select#type').find(":selected").val();
        

        fetch('/createFile', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ NewFileName: filename, FileParentPath: location.pathname, FileType: fileType, size: size, mediaId: mediaId}),
        })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success){
                displayError(error);
                return;
            }
            const successMessage = $(".newfile-form .success-message");
            successMessage.text(data.message);
            successMessage.slideToggle();
            setTimeout(200)
            location.reload();
        })
        .catch((error) => {
            displayError(error)
        });
});

function displayError(error) {
    const errorMessage = $(".newfile-form .error-message");
    errorMessage.text(`An error occurred during fetching media data. Error: ${error}`);
    errorMessage.slideToggle();
    console.error("Error during fetching media data:", error);
}