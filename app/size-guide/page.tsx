import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Find your perfect fit with the OnSite Club size guide. Measurements for tees, hoodies, and caps.',
};

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-warm-400 block mb-3">Fit Reference</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
            Size Guide
          </h1>
          <p className="font-body text-text-secondary mb-10 leading-relaxed">
            All measurements are in inches. If you&apos;re between sizes, we recommend sizing up for a more relaxed fit.
          </p>

          <div className="prose-section">
            <h2>Cotton Tees</h2>
            <p>Classic fit — relaxed through the chest and body. Pre-shrunk cotton.</p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Sleeve (in)</th>
                    <th>Chest (cm)</th>
                    <th>Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>36–38</td><td>28</td><td>8</td><td>91–97</td><td>71</td></tr>
                  <tr><td>M</td><td>39–41</td><td>29</td><td>8.5</td><td>99–104</td><td>74</td></tr>
                  <tr><td>L</td><td>42–44</td><td>30</td><td>9</td><td>107–112</td><td>76</td></tr>
                  <tr><td>XL</td><td>45–47</td><td>31</td><td>9.5</td><td>114–119</td><td>79</td></tr>
                  <tr><td>2XL</td><td>48–50</td><td>32</td><td>10</td><td>122–127</td><td>81</td></tr>
                  <tr><td>3XL</td><td>51–53</td><td>33</td><td>10.5</td><td>130–135</td><td>84</td></tr>
                </tbody>
              </table>
            </div>

            <h2>Sport Tees</h2>
            <p>Athletic fit — slightly tapered through the body. Moisture-wicking polyester blend.</p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Chest (cm)</th>
                    <th>Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>35–37</td><td>27.5</td><td>89–94</td><td>70</td></tr>
                  <tr><td>M</td><td>38–40</td><td>28.5</td><td>97–102</td><td>72</td></tr>
                  <tr><td>L</td><td>41–43</td><td>29.5</td><td>104–109</td><td>75</td></tr>
                  <tr><td>XL</td><td>44–46</td><td>30.5</td><td>112–117</td><td>77</td></tr>
                  <tr><td>2XL</td><td>47–49</td><td>31.5</td><td>119–124</td><td>80</td></tr>
                </tbody>
              </table>
            </div>

            <h2>Hoodies</h2>
            <p>Relaxed fit — generous through the chest and body. Heavyweight fleece.</p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Sleeve (in)</th>
                    <th>Chest (cm)</th>
                    <th>Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>38–40</td><td>27</td><td>24</td><td>97–102</td><td>69</td></tr>
                  <tr><td>M</td><td>41–43</td><td>28</td><td>24.5</td><td>104–109</td><td>71</td></tr>
                  <tr><td>L</td><td>44–46</td><td>29</td><td>25</td><td>112–117</td><td>74</td></tr>
                  <tr><td>XL</td><td>47–49</td><td>30</td><td>25.5</td><td>119–124</td><td>76</td></tr>
                  <tr><td>2XL</td><td>50–52</td><td>31</td><td>26</td><td>127–132</td><td>79</td></tr>
                  <tr><td>3XL</td><td>53–55</td><td>32</td><td>26.5</td><td>135–140</td><td>81</td></tr>
                </tbody>
              </table>
            </div>

            <h2>Caps</h2>
            <p>One size fits most — adjustable snapback or strap closure.</p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Style</th>
                    <th>Circumference</th>
                    <th>Closure</th>
                    <th>Fit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Premium Cap</td><td>21.5–23.5 in (55–60 cm)</td><td>Adjustable snapback</td><td>Structured, mid-crown</td></tr>
                  <tr><td>Classic Cap</td><td>21.5–23.5 in (55–60 cm)</td><td>Adjustable strap</td><td>Unstructured, low-crown</td></tr>
                </tbody>
              </table>
            </div>

            <hr />

            <h2>How to Measure</h2>
            <ul>
              <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape level.</li>
              <li><strong>Length:</strong> Measure from the highest point of the shoulder to the bottom hem.</li>
              <li><strong>Sleeve:</strong> Measure from the shoulder seam to the end of the sleeve.</li>
            </ul>

            <h2>Still Not Sure?</h2>
            <p>
              Email us at <a href="mailto:contact@onsiteclub.ca">contact@onsiteclub.ca</a> with your height and weight, and we&apos;ll recommend the best size for you.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
