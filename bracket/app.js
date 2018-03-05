(function () {

    var request = new XMLHttpRequest();
    request.open('GET', 'bracket.json');
    request.responseType = 'text';
    request.onload = function() {
        let data = JSON.parse(request.response);
        var bracketData = {
            teams : data.teams,
            results : [
            ]
        };

        $('#bracket').bracket({
            init: bracketData,
            teamWidth: 400
        })
    };

    request.send();

})();