async function dynamic_table(columns, data){
    let table = document.createElement("table")
    table.setAttribute("id", "resultsTable")
    table.setAttribute("class", "table table-responsive")
    let th = '<thead><tr>'
    for (let column in columns){
        th += `<th>${column}</th>`
    }
    th += '</tr></thead>'
    //<table id="resultsTable" class="table table-responsive">
    //  <thead>
    //    <tr>
    //      <th>S.No</th>
    //      <th>Statement</th>
    //      <th>Marks</th>
    //    </tr>
    //  </thead>
    //  <tbody id="resultsBody"></tbody>
    //</table>
    let tb = '<tbody id="resultsBody">'
    for (let index in data){
        tb += `<tr>`
        for (let key in data.index){
            tb += `<td>${data.index.key}</td>`
        }
        tb += `</tr>`
    }
    tb += '</tbody>'
    table.innerHTML = th + tb
}