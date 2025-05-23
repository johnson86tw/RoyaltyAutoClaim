import { CHAIN_ID } from '@/config'
import { formatErrMsg, normalizeError } from '@/lib/error'
import { RoyaltyAutoClaim4337 } from '@/lib/RoyaltyAutoClaim4337'
import { MockToken, RoyaltyAutoClaim } from '@/typechain-types'
import { ethers, parseEther } from 'ethers'
import { describe, expect, it } from 'vitest'
import { deployContracts } from './test-utils'

export const VITE_TEST_PRIVATE_KEY = import.meta.env.VITE_TEST_PRIVATE_KEY
if (!VITE_TEST_PRIVATE_KEY) {
	throw new Error('VITE_TEST_PRIVATE_KEY is not set in .env')
}

export const VITE_TEST_PRIVATE_KEY_2 = import.meta.env.VITE_TEST_PRIVATE_KEY_2
if (!VITE_TEST_PRIVATE_KEY_2) {
	throw new Error('VITE_TEST_PRIVATE_KEY_2 is not set in .env')
}

describe('e2e-sepolia', () => {
	let account0: ethers.Wallet
	let account1: ethers.Wallet
	let token: MockToken
	let tokenAddress: string
	let proxyAddress: string
	let royaltyAutoClaim: RoyaltyAutoClaim
	let royaltyAutoClaim4337: RoyaltyAutoClaim4337

	it('should deploy contracts', async () => {
		const data = await deployContracts(CHAIN_ID.SEPOLIA, VITE_TEST_PRIVATE_KEY, VITE_TEST_PRIVATE_KEY_2)
		account0 = data.account0
		account1 = data.account1
		token = data.token
		tokenAddress = data.tokenAddress
		proxyAddress = data.proxyAddress
		royaltyAutoClaim = data.royaltyAutoClaim
		royaltyAutoClaim4337 = data.royaltyAutoClaim4337
	})

	it('should submit a submission', async () => {
		try {
			const op = await royaltyAutoClaim4337.sendCalldata(
				royaltyAutoClaim.interface.encodeFunctionData('registerSubmission', ['test_title', account0.address]),
			)
			const receipt = await op.wait()
			expect(receipt.success).to.be.true
		} catch (e: unknown) {
			const err = normalizeError(e)
			throw new Error(formatErrMsg(err))
		}
	})

	it('should review the submission', async () => {
		try {
			let op = await royaltyAutoClaim4337.sendCalldata(
				royaltyAutoClaim.interface.encodeFunctionData('reviewSubmission', ['test_title', '20']),
			)
			let receipt = await op.wait()
			expect(receipt.success).to.be.true

			op = await royaltyAutoClaim4337
				.connect(account1)
				.sendCalldata(royaltyAutoClaim.interface.encodeFunctionData('reviewSubmission', ['test_title', '40']))
			receipt = await op.wait()
			expect(receipt.success).to.be.true
		} catch (e: unknown) {
			const err = normalizeError(e)
			throw new Error(formatErrMsg(err))
		}
	})

	it('should claim the submission', async () => {
		try {
			const RACBalanceBefore = await token.balanceOf(proxyAddress)
			const recipientBalanceBefore = await token.balanceOf(account0.address)

			const op = await royaltyAutoClaim4337
				.connect(account0)
				.sendCalldata(royaltyAutoClaim.interface.encodeFunctionData('claimRoyalty', ['test_title']))
			const receipt = await op.wait()
			expect(receipt.success).to.be.true

			const RACBalanceAfter = await token.balanceOf(proxyAddress)
			const recipientBalanceAfter = await token.balanceOf(account0.address)

			expect(RACBalanceBefore - RACBalanceAfter).to.be.equal(parseEther('30'))
			expect(recipientBalanceAfter - recipientBalanceBefore).to.be.equal(parseEther('30'))
		} catch (e: unknown) {
			const err = normalizeError(e)
			throw new Error(formatErrMsg(err))
		}
	})
})
