
interface ChartData {
  labels: string[];
  data: number[];
}

export async function generatePieChartUrl(chartData: ChartData, baseUrl?: string): Promise<string> {
  if (chartData.data.length === 0) return '';

  // Pastel & Vibrant Color Palette
  const colors = [
    '#FF6384', // Red
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#C9CBCF', // Grey
    '#E7E9ED', // Light Grey
    '#76A346'  // Green
  ];

  const chartConfig = {
    type: 'doughnut', // Changed to Doughnut for modern look
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: colors,
        borderColor: '#ffffff', // White borders for separation
        borderWidth: 2
      }]
    },
    options: {
      title: {
        display: true,
        text: 'Spending Breakdown',
        fontSize: 18,
        fontColor: '#333'
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: { size: 12 },
            padding: 15
          }
        },
        datalabels: {
          display: true,
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (value: any) => {
            return value > 0 ? '$' + value : '';
          }
        }
      }
    }
  };

  try {
    const response = await fetch('https://quickchart.io/chart/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chart: chartConfig,
        width: 500,
        height: 300,
        backgroundColor: 'transparent',
        format: 'png', // Explicitly request PNG format
      }),
    });

    if (!response.ok) {
      console.error('QuickChart API Error:', await response.text());
      return '';
    }

    const result = await response.json();
    const shortUrl = result.url; // e.g. https://quickchart.io/chart/render/zf-xxxx
    
    if (baseUrl) {
      const chartId = shortUrl.split('/').pop();
      if (chartId) {
        // Use local proxy to satisfy Line's .png extension requirement
        // This hits /chart/:id.png which rewrites to QuickChart
        return `${baseUrl}/chart/${chartId}.png`;
      }
    }

    // Fallback: Try query param trick if no baseUrl provided
    return `${shortUrl}?open=.png`; 
  } catch (error) {
    console.error('Failed to generate chart URL:', error);
    return '';
  }
}
