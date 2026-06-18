const fs = require('fs');
const path = require('path');

function makePdf(text) {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = Buffer.from('BT /F1 9 Tf 50 750 Td (' + escaped + ') Tj ET');
  const streamLen = stream.length;

  const obj1 = Buffer.from('1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n');
  const obj2 = Buffer.from('2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n');
  const obj3 = Buffer.from('3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>>>> \nendobj\n');
  const obj4Header = Buffer.from('4 0 obj\n<</Length ' + streamLen + '>>\nstream\n');
  const obj4Footer = Buffer.from('\nendstream\nendobj\n');

  const header = Buffer.from('%PDF-1.4\n');

  const offsets = [];
  let pos = header.length;

  offsets.push(pos); pos += obj1.length;
  offsets.push(pos); pos += obj2.length;
  offsets.push(pos); pos += obj3.length;
  offsets.push(pos); pos += obj4Header.length + stream.length + obj4Footer.length;

  const xrefPos = pos;
  let xref = 'xref\n0 5\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  const trailer = 'trailer\n<</Size 5 /Root 1 0 R>>\nstartxref\n' + xrefPos + '\n%%EOF\n';

  return Buffer.concat([header, obj1, obj2, obj3, obj4Header, stream, obj4Footer, Buffer.from(xref + trailer)]);
}

const base = path.join(__dirname, 'resumes');

const fixtures = {
  'sample-clean': 'John Smith Senior Software Engineer john.smith@email.com +1 555 123 4567 linkedin.com/in/johnsmith San Francisco CA USA SUMMARY Results-driven Senior Software Engineer with 8 years building scalable distributed systems and leading engineering teams. EXPERIENCE Senior Software Engineer Google Jan 2020 Present San Francisco CA Led design of microservices architecture reducing latency by 40 percent. Built CI/CD pipelines cutting deploy time by 60 percent. Mentored 5 junior engineers improving team velocity by 30 percent. Software Engineer Facebook Jun 2016 Dec 2019 Menlo Park CA Developed data pipeline processing 10 million events per day using Apache Kafka and Spark. PROJECTS Open Source Monitor github.com/johnsmith/monitor 2021 2022 Built Prometheus monitoring dashboard used by 200 engineering teams. EDUCATION BS Computer Science Stanford University Stanford CA 2016 GPA 3.8 CERTIFICATIONS AWS Solutions Architect Amazon 2021 Google Cloud Professional Google 2022 SKILLS Programming Python Java TypeScript Go SQL Cloud AWS GCP Azure Docker Kubernetes',

  'sample-multi-column': 'Maria Garcia Full Stack Developer maria.garcia@email.com 415-555-9876 linkedin.com/in/mariagarcia New York NY USA PROFESSIONAL SUMMARY Innovative Full Stack Developer with 6 years crafting performant web applications. Expert in React TypeScript Node.js and modern cloud architectures. WORK EXPERIENCE Lead Developer Stripe Mar 2021 Present New York NY Architected payment processing system handling 5M transactions per month with 99.99 percent uptime. Built real-time fraud detection reducing chargebacks by 35 percent. Led team of 8 engineers across 3 time zones. Frontend Engineer Twilio Aug 2018 Feb 2021 San Francisco CA Rebuilt customer dashboard reducing page load from 4s to 800ms. Implemented A/B testing driving 22 percent improvement in conversion. SIDE PROJECTS E-commerce Platform 2022 2023 github.com/mgarcia/shop Built full-stack e-commerce app with 10K active users using Next.js and Stripe API. EDUCATION MS Computer Science Columbia University New York NY 2018 GPA 3.9 BS Software Engineering Universidad Nacional Mexico City 2016 CERTIFICATIONS Meta Frontend Developer Meta 2022 AWS Developer Associate Amazon 2021 TECHNICAL SKILLS Frontend React Next.js TypeScript Vue.js Backend Node.js Python Django FastAPI Database PostgreSQL MongoDB Redis DevOps Docker Kubernetes',

  'sample-list-heavy': 'David Chen DevOps Engineer david.chen@email.com +1 650 555 2345 linkedin.com/in/davidchen Austin TX USA ABOUT ME Senior DevOps Engineer with 10 years automating infrastructure and building SRE practices. Specializing in Kubernetes AWS and observability platforms. EXPERIENCE Senior DevOps Engineer Netflix Jan 2022 Present Austin TX Designed multi-region Kubernetes clusters serving 50M users globally. Reduced infrastructure costs by 28 percent through spot instance optimization. Built self-service deployment platform cutting time-to-production from 2 weeks to 1 day. Established SRE practices achieving 99.95 percent SLA across all services. DevOps Lead Lyft May 2019 Dec 2021 San Francisco CA Led migration from monolith to containerized microservices. Implemented GitOps with ArgoCD reducing deployment errors by 80 percent. SRE Airbnb Jan 2017 Apr 2019 San Francisco CA Automated disaster recovery reducing RTO from 4 hours to 15 minutes. PROJECTS Kubernetes Operator github.com/dchen/pg-operator 2023 PostgreSQL lifecycle automation with 500 GitHub stars. EDUCATION BE Computer Science University of Texas Austin TX 2014 GPA 3.7 CERTIFICATIONS CKA CNCF 2023 AWS Solutions Architect Professional Amazon 2022 Terraform Associate HashiCorp 2021 SKILLS Kubernetes Docker AWS GCP Azure Terraform Ansible GitHub Actions ArgoCD Prometheus Grafana Python Go Bash TypeScript'
};

for (const [name, text] of Object.entries(fixtures)) {
  const buf = makePdf(text);
  const p = path.join(base, name + '.pdf');
  fs.writeFileSync(p, buf);
  console.log('Written', p, '(' + buf.length + ' bytes)');
}
