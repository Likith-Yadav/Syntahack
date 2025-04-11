import { ethers } from "hardhat";

async function main() {
  // Get the contract instance
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EduChain = await ethers.getContractFactory("EduChain");
  const eduChain = EduChain.attach(contractAddress);

  // Get signers (accounts)
  const [owner, institution, student] = await ethers.getSigners();
  console.log("Institution Address:", institution.address);
  console.log("Student Address:", student.address);

  try {
    // 1. Register an institution
    console.log("\n1. Registering institution...");
    const tx1 = await eduChain.connect(institution).registerInstitution(
      "MIT University",
      "Cambridge, MA"
    );
    await tx1.wait();
    console.log("Institution registered successfully!");

    // 2. Issue a credential
    console.log("\n2. Issuing credential...");
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryDate = currentTime + 365 * 24 * 60 * 60; // 1 year from now
    
    const tx2 = await eduChain.connect(institution).issueCredential(
      student.address,
      "John Doe",
      "Computer Science",
      expiryDate
    );
    await tx2.wait();
    console.log("Credential issued successfully!");

    // 3. Get student credentials
    console.log("\n3. Getting student credentials...");
    const credentials = await eduChain.getStudentCredentials(student.address);
    console.log("Student Credentials:", credentials);

    // 4. Verify the credential
    if (credentials.length > 0) {
      console.log("\n4. Verifying credential...");
      const isValid = await eduChain.verifyCredential(credentials[0]);
      console.log("Is credential valid?", isValid);
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 