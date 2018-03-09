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
            teamWidth: 250,
            matchMargin: 5,
            roundMargin: 20
        })
    };

    request.send();

})();