document.addEventListener('DOMContentLoaded', () => {
  const numberInput = document.getElementById('numberInput');
  const checkBtn = document.getElementById('checkBtn');
  const resultDiv = document.getElementById('result');
  
  checkBtn.addEventListener('click', checkPrime);
  numberInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkPrime();
  });

  async function checkPrime() {
    const number = numberInput.value.trim();
    
    if (!number) {
      showResult('Vui lòng nhập số!', 'error');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/check-prime?number=${number}`);
      const data = await response.json();
      
      if (data.error) {
        showResult(data.error, 'error');
      } else {
        const { number, isPrime } = data;
        const message = isPrime 
          ? `${number} là số nguyên tố!` 
          : `${number} không phải số nguyên tố!`;
        
        showResult(message, isPrime ? 'prime' : 'not-prime');
      }
    } catch (error) {
      showResult('Lỗi kết nối đến server', 'error');
      console.error('API Error:', error);
    }
  }

  function showResult(message, className) {
    resultDiv.textContent = message;
    resultDiv.className = 'result ' + className;
  }
});