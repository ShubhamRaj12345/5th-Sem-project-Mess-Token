// script.js
document.getElementById("tokenForm").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const name = document.getElementById("name").value;
    const plates = document.getElementById("plates").value;
  
    const tokenHistory = document.getElementById("tokenHistory");
  
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${plates}</td>
    `;
  
    tokenHistory.appendChild(row);
  
    // Clear form fields
    document.getElementById("tokenForm").reset();
  });
  