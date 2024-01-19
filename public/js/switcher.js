var switcherWrapper = $(".switcher-warpper");

switcherWrapper.on("click", "li", function() {
   var selectedItem = $(this),
       nextListItem = selectedItem.next('li'),
       previousListItem = selectedItem.prev('li');

   switcherWrapper.find(".selected").removeClass("selected");

   if (nextListItem.length > 0) {
       nextListItem.addClass('selected');
       toggleBulkContainer(false);
   }
   else if (previousListItem.length > 0) {
       previousListItem.addClass('selected');
       toggleBulkContainer(true);
   }
});

function toggleBulkContainer(isNext) {
   if (isNext) {
       $(".one-container").hide();
       $(".bulk-container").show();
   } else {
       $(".bulk-container").hide();
       $(".one-container").show();
   }
}